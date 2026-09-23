import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Paperclip,
  Sparkles,
  FileText,
  History,
  Plus,
  Trash2,
  MessageSquare,
  Search,
  Check,
  Copy,
  ChevronLeft,
  Clock,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  Cpu,
  Loader2,
  CodeXml,
  Mic,
  MicOff,
} from 'lucide-react';
import { GeminiModel } from '../types';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { apiUrl, generateGeminiFallback } from '../lib/api';
import { deviceRpa } from '../lib/deviceRpa';

export interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  files?: string[];
  isLiveApi?: boolean;
  isFallback?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  model: GeminiModel;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface GeminiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: GeminiModel;
  currentQuery: string;
  onSelectModel?: (model: GeminiModel) => void;
  onSearchQuery?: (query: string) => void;
}

const STORAGE_KEY = 'myengine_gemini_chat_sessions';
const STORAGE_API_KEY = 'myengine_gemini_api_key';

const ALL_MODELS: { id: GeminiModel; label: string; desc: string; badge?: string }[] = [
  { id: 'Gemini 3.8', label: 'Gemini 3.8', desc: '高速レスポンス・基本テキスト' },
  { id: 'Gemini 3.1 Pro', label: 'Gemini 3.1 PRO', desc: '長文思考・高度推論・コード設計', badge: 'PRO' },
  { id: 'Gemini 3.7', label: 'Gemini 3.7', desc: 'バランス型ハイブリッド推論' },
  { id: 'Gemini 3.5', label: 'Gemini 3.5', desc: '詳細分析・高精度コンテキスト' },
  { id: 'Gemini 3 Pro', label: 'Gemini 3 Pro', desc: '専門推論・プログラミング支援' },
  { id: 'ナノバナナ', label: 'ナノバナナ', desc: '超軽量オンデバイス型検索' },
];

export const GeminiDrawer: React.FC<GeminiDrawerProps> = ({
  isOpen,
  onClose,
  activeModel,
  currentQuery,
  onSelectModel,
  onSearchQuery,
}) => {
  // Session storage state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s) => s && !s.id?.startsWith('session-seed-'));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((s) => s && !s.id?.startsWith('session-seed-'));
          if (valid[0]?.id) return valid[0].id;
        }
      }
    } catch {
      // ignore
    }
    return '';
  });

  // User API Key State & Storage
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_API_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [inputApiKey, setInputApiKey] = useState(apiKey);
  const [showPlainKey, setShowPlainKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [keyTestMessage, setKeyTestMessage] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Model selection dropdown within drawer
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Current active messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const [messages, setMessages] = useState<Message[]>(activeSession ? activeSession.messages : []);

  // UI view mode: 'chat' | 'history'
  const [viewMode, setViewMode] = useState<'chat' | 'history'>('chat');
  const [historySearch, setHistorySearch] = useState('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [operationMode, setOperationMode] = useState<'chat' | 'voice' | 'rpa'>('chat');
  const [rpaActivity, setRpaActivity] = useState<string[]>([]);
  const [deviceRpaAvailable, setDeviceRpaAvailable] = useState<boolean | null>(null);
  const rpaActivityTimerRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preVoiceInputRef = useRef<string>('');

  const extractSearchQuery = (text: string) => {
    const normalized = text.trim();
    const suffixMatch = normalized.match(/^(.+?)(?:を|で)?(?:検索|調べて|探して)(?:ください|して)?[。！？!！]?$/i);
    if (suffixMatch?.[1]) return suffixMatch[1].trim();

    const prefixMatch = normalized.match(/^(?:検索|調べて|探して|search(?: for)?|look up)\s*[:：]?\s*(.+)$/i);
    return prefixMatch?.[1]?.trim() || null;
  };

  // Voice Command Handler for Gemini Drawer
  const handleDrawerVoiceCommand = (text: string): { handled: boolean } => {
    const raw = text.trim();
    if (!raw) return { handled: false };

    // 1. Cancel
    if (/^(キャンセル|やめて|取り消し|とりけし|リセット|cancel|abort|discard)$/i.test(raw)) {
      triggerCommandSuccess({ type: 'cancel', label: voiceLanguage === 'en-US' ? 'Cancel' : 'キャンセル' });
      setTimeout(() => {
        cleanupVoiceRecognition();
        setInput(preVoiceInputRef.current);
        setTriggeredCommand(null);
      }, 400);
      return { handled: true };
    }

    // 2. Clear
    if (/^(クリア|消して|けして|全部消して|クリアして|clear|clear all|reset|erase)$/i.test(raw)) {
      triggerCommandSuccess({ type: 'clear', label: voiceLanguage === 'en-US' ? 'Clear' : 'クリア' });
      setInput('');
      setTimeout(() => {
        setTriggeredCommand(null);
      }, 600);
      return { handled: true };
    }

    // 3. Stop
    if (/^(終了|ストップ|完了|終わり|おわり|stop|finish|done|complete)$/i.test(raw)) {
      triggerCommandSuccess({ type: 'stop', label: voiceLanguage === 'en-US' ? 'Done' : '終了' });
      setTimeout(() => {
        cleanupVoiceRecognition();
        setTriggeredCommand(null);
      }, 450);
      return { handled: true };
    }

    // 4. Send / Submit Command
    // 「〜を送信」「〜送信」「〜聞いて」「〜質問」「送信して」「send ~」「ask ~」
    const sendMatchJa = raw.match(
      /^(.*?)(?:を|で)?(?:送信|そうしん|質問|しつもん|聞いて|きいて|send)(?:して|してよ|お願い)?$/i
    );
    const sendMatchEn = raw.match(/^(?:send|ask|submit)\s+(.*)$/i);
    const sendMatch = sendMatchJa || sendMatchEn;

    if (sendMatch) {
      const extracted = sendMatch[1]?.trim() || '';
      const targetText = extracted || input || raw;
      if (targetText) {
        triggerCommandSuccess({ type: 'send', label: voiceLanguage === 'en-US' ? 'Send' : '送信' });
        setTimeout(() => {
          cleanupVoiceRecognition();
          setInput('');
          handleSend(targetText);
          setTriggeredCommand(null);
        }, 450);
        return { handled: true };
      }
    }

    if (/^(送信|そうしん|send|submit)$/i.test(raw)) {
      const target = input.trim() || preVoiceInputRef.current.trim();
      if (target) {
        triggerCommandSuccess({ type: 'send', label: voiceLanguage === 'en-US' ? 'Send' : '送信' });
        setTimeout(() => {
          cleanupVoiceRecognition();
          setInput('');
          handleSend(target);
          setTriggeredCommand(null);
        }, 450);
        return { handled: true };
      }
    }

    return { handled: false };
  };

  const {
    isListening,
    voiceLanguage,
    activeAudioStream,
    commandScreenFlash,
    triggeredCommand,
    setTriggeredCommand,
    isSupported: isVoiceSupported,
    setLanguage: setVoiceLanguage,
    handleToggleVoice: toggleVoiceRaw,
    cleanupVoiceRecognition,
    triggerCommandSuccess,
  } = useVoiceRecognition({
    initialLanguage: 'ja-JP',
    onTranscriptChange: (_interim, final) => {
      const finalText = final.trim();
      if (finalText && !handleDrawerVoiceCommand(finalText).handled) {
        setInput(finalText);
        if (operationMode === 'voice') {
          window.setTimeout(() => handleSend(finalText), 0);
        }
      }
    },
  });

  const handleSwitchVoiceLanguage = (newLang: 'ja-JP' | 'en-US') => {
    setVoiceLanguage(newLang);
  };

  const handleToggleVoice = (overrideLang?: 'ja-JP' | 'en-US' | React.SyntheticEvent) => {
    if (!isVoiceSupported) return;
    preVoiceInputRef.current = input;
    toggleVoiceRaw(overrideLang);
  };

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      if (rpaActivityTimerRef.current) {
        window.clearInterval(rpaActivityTimerRef.current);
      }
      cleanupVoiceRecognition();
    };
  }, [cleanupVoiceRecognition]);

  useEffect(() => {
    if (operationMode !== 'rpa') {
      setDeviceRpaAvailable(null);
      return;
    }
    let isMounted = true;
    void deviceRpa
      .getStatus()
      .then((status) => {
        if (isMounted) setDeviceRpaAvailable(status.available);
      })
      .catch(() => {
        if (isMounted) setDeviceRpaAvailable(null);
      });
    return () => {
      isMounted = false;
    };
  }, [operationMode]);

  // Sync messages when active session changes
  useEffect(() => {
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session) {
      setMessages(session.messages);
    }
  }, [activeSessionId]);

  // Save to localStorage when sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Sync inputApiKey when modal opens
  useEffect(() => {
    if (isApiKeyModalOpen) {
      setInputApiKey(apiKey);
      setKeyTestStatus('idle');
      setKeyTestMessage('');
      setSaveSuccess(false);
    }
  }, [isApiKeyModalOpen, apiKey]);

  // Handle Save API Key
  const handleSaveApiKey = () => {
    const trimmed = inputApiKey.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_API_KEY, trimmed);
        setApiKey(trimmed);
      } else {
        localStorage.removeItem(STORAGE_API_KEY);
        setApiKey('');
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsApiKeyModalOpen(false);
      }, 1000);
    } catch {
      // ignore
    }
  };

  // Handle Test API Key
  const handleTestApiKey = async () => {
    const keyToTest = inputApiKey.trim();
    if (!keyToTest) {
      setKeyTestStatus('error');
      setKeyTestMessage('APIキーを入力してください。');
      return;
    }

    setKeyTestStatus('testing');
    setKeyTestMessage('Google Gemini APIとの接続を確認中...');

    try {
      const res = await fetch(apiUrl('/api/gemini/validate-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setKeyTestStatus('success');
        setKeyTestMessage(`✓ ${data.message || '認証成功！Google Gemini APIと接続されました。'}`);
      } else {
        setKeyTestStatus('error');
        setKeyTestMessage(data.error || 'APIキーの検証に失敗しました。キーを確認してください。');
      }
    } catch (err: any) {
      setKeyTestStatus('error');
      setKeyTestMessage('サーバーへの接続に失敗しました。');
    }
  };

  // Handle Delete API Key
  const handleDeleteApiKey = () => {
    if (window.confirm('登録済みのAPIキーを削除しますか？')) {
      try {
        localStorage.removeItem(STORAGE_API_KEY);
        setApiKey('');
        setInputApiKey('');
        setKeyTestStatus('idle');
        setKeyTestMessage('');
      } catch {
        // ignore
      }
    }
  };

  // Update session messages helper
  const updateSessionMessages = (newMessages: Message[], newTitle?: string) => {
    if (!activeSessionId) {
      const newId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: newId,
        title: newTitle ? `検索: ${newTitle.slice(0, 22)}` : '新規チャット',
        model: activeModel,
        createdAt: new Date().toLocaleDateString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        updatedAt: new Date().toLocaleDateString('ja-JP', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
        messages: newMessages,
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newId);
      return;
    }

    setSessions((prev) => {
      return prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: newMessages,
            title: newTitle && s.title === '新規チャット' ? newTitle.slice(0, 24) : s.title,
            updatedAt: new Date().toLocaleDateString('ja-JP', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        }
        return s;
      });
    });
  };

  // Start a fresh new chat session
  const handleStartNewChat = () => {
    const newId = `session-${Date.now()}`;
    const initialGreeting: Message = {
      id: `m-init-${Date.now()}`,
      sender: 'gemini',
      text: apiKey
        ? `こんにちは！ユーザー設定のGemini APIキーで接続中です。何でもご質問ください。`
        : `こんにちは！${activeModel} アシスタントです。右上の「🔑 APIキー」からご自身のGoogle AI Studioキーを登録すると、上限なく超高速に会話・直接検索が可能です。`,
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    };

    const newSession: ChatSession = {
      id: newId,
      title: currentQuery ? `検索: ${currentQuery.slice(0, 22)}` : '新規チャット',
      model: activeModel,
      createdAt: new Date().toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      updatedAt: new Date().toLocaleDateString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      messages: [initialGreeting],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessages([initialGreeting]);
    setInput('');
    setAttachedFiles([]);
    setViewMode('chat');
  };

  // Select an existing chat session from history
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const chosen = sessions.find((s) => s.id === sessionId);
    if (chosen) {
      setMessages(chosen.messages);
    }
    setViewMode('chat');
  };

  // Delete a chat session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        setMessages(remaining[0].messages);
      } else {
        setActiveSessionId('');
        setMessages([]);
      }
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('すべてのチャット履歴を消去しますか？')) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      setSessions([]);
      setActiveSessionId('');
      setMessages([]);
    }
  };

  // Send message
  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() && attachedFiles.length === 0) return;

    const isRpaMode = operationMode === 'rpa';
    if (isRpaMode && onSearchQuery) {
      const requestedSearch = extractSearchQuery(text);
      if (requestedSearch) {
        setRpaActivity(['ユーザー指示を解析中', `検索対象を検出: ${requestedSearch}`]);
        onSearchQuery(requestedSearch);
      }
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      files: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    updateSessionMessages(nextMessages, text.trim());

    setInput('');
    setAttachedFiles([]);
    setIsTyping(true);

    const chatHistory = messages.slice(-6).map((m) => ({
      sender: m.sender,
      text: m.text,
    }));
    const prompt = isRpaMode
      ? `${text.trim()}\n\nRPA実行モードです。MyEngineの画面を操作してユーザーの依頼をリアルタイムに実行してください。検索が必要な場合は、回答内に必ず [SEARCH: 検索語] を1行で含めてください。Android画面操作が必要な場合は、許可された操作だけを [RPA: {"action":"tap|type|scroll-forward|scroll-backward","text":"任意","viewId":"任意"}] の1行JSONで含めてください。実行状況を短い手順ログとして回答してください。`
      : text.trim();

    if (isRpaMode) {
      setRpaActivity(['RPAエージェントを起動中', 'Gemini RPAモデルに接続中', '画面操作の手順を組み立て中']);
      if (rpaActivityTimerRef.current) window.clearInterval(rpaActivityTimerRef.current);
      const activitySteps = ['検索エンジンの入力欄を確認中', '検索語を入力して実行中', '検索結果をリアルタイム取得中'];
      let activityIndex = 0;
      rpaActivityTimerRef.current = window.setInterval(() => {
        setRpaActivity((prev) => [...prev.slice(-3), activitySteps[activityIndex++ % activitySteps.length]]);
      }, 850);
    }

    try {
      const res = await fetch(apiUrl('/api/gemini/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-Gemini-API-Key': apiKey } : {}),
        },
        body: JSON.stringify({
          prompt,
          history: chatHistory,
          model: isRpaMode ? 'Gemini RPA' : activeModel,
          apiKey: apiKey || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (isRpaMode && onSearchQuery) {
          const searchCommand = String(data.reply || '').match(/\[SEARCH:\s*(.+?)\]/i);
          if (searchCommand?.[1]) {
            onSearchQuery(searchCommand[1].trim());
            setRpaActivity((prev) => [...prev.slice(-3), `検索を実行: ${searchCommand[1].trim()}`, '検索結果を画面に反映しました']);
          }
        }
        if (isRpaMode) {
          const deviceCommand = String(data.reply || '').match(/\[RPA:\s*(\{.+?\})\]/i);
          if (deviceCommand?.[1]) {
            try {
              const parsed = JSON.parse(deviceCommand[1]) as {
                action?: 'tap' | 'type' | 'scroll-forward' | 'scroll-backward';
                text?: string;
                viewId?: string;
              };
              if (parsed.action) {
                const result = await deviceRpa.executeAction({
                  action: parsed.action,
                  text: parsed.text,
                  viewId: parsed.viewId,
                });
                setRpaActivity((prev) => [
                  ...prev.slice(-3),
                  result.executed ? `端末操作を実行: ${parsed.action}` : `端末操作を確認できません: ${parsed.action}`,
                ]);
              }
            } catch {
              setRpaActivity((prev) => [...prev.slice(-3), '端末RPAはこの環境では利用できません']);
            }
          }
        }
        const geminiMsg: Message = {
          id: `msg-${Date.now()}-reply`,
          sender: 'gemini',
          text: data.reply || '回答を受信できませんでした。',
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          isLiveApi: true,
          isFallback: data.isFallback === true,
        };

        const finalMessages = [...nextMessages, geminiMsg];
        setMessages(finalMessages);
        updateSessionMessages(finalMessages);
        setIsTyping(false);
        if (isRpaMode && rpaActivityTimerRef.current) {
          window.clearInterval(rpaActivityTimerRef.current);
          rpaActivityTimerRef.current = null;
        }
      } else {
        const errData = await res.json().catch(() => null);
        if (apiKey) {
          try {
            const fallbackReply = await generateGeminiFallback(prompt, chatHistory, apiKey);
            const fallbackMsg: Message = {
              id: `msg-${Date.now()}-reply`,
              sender: 'gemini',
              text: fallbackReply,
              timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
              isLiveApi: true,
            };
            const fallbackMessages = [...nextMessages, fallbackMsg];
            setMessages(fallbackMessages);
            updateSessionMessages(fallbackMessages);
            setIsTyping(false);
            return;
          } catch {
            // Fall through to the server error shown below.
          }
        }
        const errMsg = errData?.error || `APIエラー (${res.status})`;
        const geminiMsg: Message = {
          id: `msg-${Date.now()}-reply`,
          sender: 'gemini',
          text: `⚠️ ${errMsg}\n\n右上の「🔑 APIキー」からご自身のGoogle AI Studio無料APIキーを設定してください。`,
          timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
          isLiveApi: false,
        };
        const finalMessages = [...nextMessages, geminiMsg];
        setMessages(finalMessages);
        updateSessionMessages(finalMessages);
        setIsTyping(false);
        if (isRpaMode && rpaActivityTimerRef.current) {
          window.clearInterval(rpaActivityTimerRef.current);
          rpaActivityTimerRef.current = null;
        }
      }
    } catch (err: any) {
      if (apiKey) {
        try {
          const fallbackReply = await generateGeminiFallback(prompt, chatHistory, apiKey);
          const fallbackMsg: Message = {
            id: `msg-${Date.now()}-reply`,
            sender: 'gemini',
            text: fallbackReply,
            timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
            isLiveApi: true,
          };
          const fallbackMessages = [...nextMessages, fallbackMsg];
          setMessages(fallbackMessages);
          updateSessionMessages(fallbackMessages);
          setIsTyping(false);
          return;
        } catch {
          // Fall through to the connection error shown below.
        }
      }
      const geminiMsg: Message = {
        id: `msg-${Date.now()}-reply`,
        sender: 'gemini',
        text: `通信エラーが発生しました。ネットワークまたはAPIキー設定をご確認ください。`,
        timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        isLiveApi: false,
      };
      const finalMessages = [...nextMessages, geminiMsg];
      setMessages(finalMessages);
      updateSessionMessages(finalMessages);
      setIsTyping(false);
      if (isRpaMode && rpaActivityTimerRef.current) {
        window.clearInterval(rpaActivityTimerRef.current);
        rpaActivityTimerRef.current = null;
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).map((f) => f.name);
      setAttachedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModelChange = (modelId: GeminiModel) => {
    if (onSelectModel) {
      onSelectModel(modelId);
    }
    setModelDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 border-l border-gray-200">
        {/* Drawer Header */}
        <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-white select-none">
          <div className="flex items-center gap-2">
            {viewMode === 'history' ? (
              <button
                type="button"
                onClick={() => setViewMode('chat')}
                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>チャットに戻る</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">Gemini AI Studio</span>
                    {/* Model Switcher Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                        className="text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                      >
                        <span>{activeModel}</span>
                        <ChevronDown size={11} />
                      </button>

                      {modelDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                          <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            AIモデルを選択
                          </div>
                          {ALL_MODELS.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleModelChange(m.id)}
                              className={`w-full text-left px-3 py-2 text-xs flex flex-col transition-colors cursor-pointer ${
                                activeModel === m.id
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{m.label}</span>
                                {m.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-normal">{m.desc}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* API Key Modal Button */}
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(true)}
              className={`p-1.5 rounded-xl border text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                apiKey
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 animate-pulse'
              }`}
              title="Gemini APIキー設定"
            >
              <Key size={13} />
              <span className="text-[11px] font-medium hidden sm:inline">
                {apiKey ? 'APIキー登録済' : '🔑 APIキー設定'}
              </span>
            </button>

            {/* History View Toggle */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'chat' ? 'history' : 'chat')}
              className={`p-1.5 rounded-xl transition-colors ${
                viewMode === 'history'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="チャット履歴"
            >
              <History size={16} />
            </button>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleStartNewChat}
              className="p-1.5 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              title="新規チャット"
            >
              <Plus size={17} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors ml-0.5 cursor-pointer"
              title="閉じる"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {viewMode === 'chat' && (
          <div className="px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/80">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <span>Gemini 操作モード</span>
              <select
                value={operationMode}
                onChange={(event) => setOperationMode(event.target.value as 'chat' | 'voice' | 'rpa')}
                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-semibold text-gray-800 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="chat">通常チャット</option>
                <option value="voice">音声会話</option>
                <option value="rpa">RPAタスク実行（Gemini RPA）</option>
              </select>
            </label>
            <p className="mt-1.5 px-1 text-[10px] text-gray-500">
              {operationMode === 'chat'
                ? '検索、画像、動画、ニュース、地図などの使い方を会話でサポートします。'
                : operationMode === 'voice'
                  ? '話した内容を確定すると、自動でGeminiへ送信します。'
                  : 'Gemini RPAが画面を操作し、検索をリアルタイムに実行します。'}
            </p>
            {operationMode === 'rpa' && deviceRpaAvailable === false && (
              <button
                type="button"
                onClick={() => void deviceRpa.openAccessibilitySettings()}
                className="mt-2 w-full rounded-lg border border-cyan-200 bg-cyan-50 px-2.5 py-2 text-left text-[10px] font-semibold text-cyan-800 hover:bg-cyan-100"
              >
                Androidの画面操作権限を有効にする
              </button>
            )}
          </div>
        )}

        {/* API Key Modal Overlay */}
        {isApiKeyModalOpen && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-gray-200 shadow-2xl p-4 sm:p-5 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Key size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Google Gemini API キー設定</h3>
                    <p className="text-[11px] text-gray-500">ユーザー独自のAPIキーを登録して上限なく利用</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <Sparkles size={14} />
                  <span>Google AI Studio から無料でAPIキーを取得可能</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  ご自身のAPIキーを入力・保存すると、この検索ソフト内のすべての直接検索およびAIチャットに自動反映されます。
                </p>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-bold hover:underline"
                >
                  <span>Google AI Studio でAPIキーを無料取得（公式）</span>
                  <ExternalLink size={11} />
                </a>
              </div>

              {/* API Key Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>Gemini API キー (AIzaSy...)</span>
                  {apiKey && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check size={11} /> 保存済み
                    </span>
                  )}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPlainKey ? 'text' : 'password'}
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full text-xs font-mono px-3 py-2.5 pr-10 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlainKey(!showPlainKey)}
                    className="absolute right-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPlainKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Status Feedback */}
              {keyTestStatus !== 'idle' && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                    keyTestStatus === 'testing'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : keyTestStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {keyTestStatus === 'testing' ? (
                    <Loader2 size={14} className="animate-spin shrink-0 mt-0.5" />
                  ) : keyTestStatus === 'success' ? (
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed text-[11px]">{keyTestMessage}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2 bg-emerald-100 text-emerald-800 text-xs rounded-xl text-center font-bold">
                  ✓ APIキーを保存・自動反映しました！
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={keyTestStatus === 'testing'}
                    className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} className="text-blue-600" />
                    <span>接続テスト</span>
                  </button>

                  {apiKey && (
                    <button
                      type="button"
                      onClick={handleDeleteApiKey}
                      className="text-xs px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      削除
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsApiKeyModalOpen(false)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-xl text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                  >
                    保存して自動反映
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: HISTORY VIEW */}
        {viewMode === 'history' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50">
            <div className="p-3 border-b border-gray-200/80 bg-white space-y-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="チャット履歴を検索..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-100 rounded-xl text-xs outline-hidden focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                <span>全 {sessions.length} 件の会話</span>
                {sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllHistory}
                    className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>すべて削除</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {sessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <MessageSquare size={32} className="stroke-1 mb-2 opacity-40" />
                  <p className="text-xs font-medium">チャット履歴はありません</p>
                  <p className="text-[10px] mt-1">「新規チャット」から会話を開始してください</p>
                </div>
              ) : (
                sessions
                  .filter((s) => s.title.toLowerCase().includes(historySearch.toLowerCase()))
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                        activeSessionId === s.id
                          ? 'bg-blue-50/80 border-blue-200 shadow-xs'
                          : 'bg-white border-gray-200/70 hover:border-gray-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MessageSquare
                          size={15}
                          className={`mt-0.5 shrink-0 ${
                            activeSessionId === s.id ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{s.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                              {s.model}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {s.updatedAt}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                        title="削除"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: ACTIVE CHAT VIEW */
          <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Gemini AI アシスタントへようこそ</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                      検索結果の分析、コード作成、文章要約など、リアルタイムに対話できます。
                    </p>
                  </div>
                  {!apiKey && (
                    <button
                      type="button"
                      onClick={() => setIsApiKeyModalOpen(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key size={13} />
                      <span>🔑 APIキーを設定して開始</span>
                    </button>
                  )}
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed group relative shadow-2xs ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                          : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                      }`}
                    >
                      {/* Live API / User Badge */}
                      <div className="flex items-center justify-between gap-2 mb-1 opacity-70 text-[10px]">
                        <span className="font-semibold">
                          {m.sender === 'user' ? 'あなた' : 'Gemini AI'}
                        </span>
                        <span>{m.timestamp}</span>
                      </div>

                      {m.sender === 'gemini' && m.isFallback && (
                        <div className="mb-2 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700 border border-amber-200">
                          <AlertCircle size={11} />
                          API混雑のため簡易応答を表示中
                        </div>
                      )}

                      {/* Attached files preview */}
                      {m.files && m.files.length > 0 && (
                        <div className="mb-2 space-y-1">
                          {m.files.map((fileName, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 text-[10px] bg-black/10 px-2 py-0.5 rounded"
                            >
                              <Paperclip size={10} />
                              <span className="truncate">{fileName}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="whitespace-pre-wrap font-sans">{m.text}</div>

                      {/* Copy Action */}
                      <button
                        type="button"
                        onClick={() => handleCopy(m.id, m.text)}
                        className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                          m.sender === 'user'
                            ? 'text-white/80 hover:bg-white/20'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                        }`}
                        title="コピー"
                      >
                        {copiedMsgId === m.id ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200/80 rounded-2xl max-w-[120px] shadow-2xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              {operationMode === 'rpa' && rpaActivity.length > 0 && (
                <div className="rounded-xl border border-cyan-200 bg-cyan-50/80 p-3 text-[10px] text-cyan-950 shadow-2xs">
                  <div className="mb-2 flex items-center gap-1.5 font-bold text-cyan-800">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
                    <span>LIVE RPA ACTIVITY</span>
                  </div>
                  <div className="space-y-1 font-mono">
                    {rpaActivity.slice(-4).map((activity, index) => (
                      <div key={`${activity}-${index}`} className="flex items-center gap-1.5">
                        <span className="text-cyan-500">{index === rpaActivity.slice(-4).length - 1 ? '›' : '✓'}</span>
                        <span>{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Attached files chips */}
            {attachedFiles.length > 0 && (
              <div className="px-4 py-1.5 bg-gray-100/80 border-t border-gray-200 flex flex-wrap gap-1.5">
                {attachedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-[10px] border border-gray-200 text-gray-700"
                  >
                    <Paperclip size={10} />
                    <span className="truncate max-w-[120px]">{file}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(i)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Fullscreen Subtle Emerald Flash Overlay on Drawer Command Trigger */}
            {commandScreenFlash && (
              <div
                aria-hidden="true"
                className="fixed inset-0 z-[9999] pointer-events-none bg-emerald-500/20 ring-[12px] ring-inset ring-emerald-400/50 backdrop-blur-[1px] transition-all duration-300 animate-in fade-in"
              />
            )}

            {/* Voice Recognition Active HUD inside Drawer */}
            {isListening && (
              <div
                className={`px-3 py-2.5 border-t text-xs flex flex-col gap-2 transition-all ${
                  triggeredCommand
                    ? 'bg-emerald-950/95 text-emerald-100 border-2 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.45)] ring-2 ring-emerald-500/20'
                    : 'bg-gray-900 text-white border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="font-bold text-[11px]">
                      {triggeredCommand
                        ? `⚡ ${voiceLanguage === 'en-US' ? 'Command:' : 'コマンド実行:'} ${triggeredCommand.label}`
                        : voiceLanguage === 'en-US' ? 'Listening (Noise Filter ON)' : '音声認識中 (ノイズ低減ON)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Dynamic Language Switcher in Drawer HUD */}
                    <div className="flex items-center bg-white/10 p-0.5 rounded-md border border-white/10">
                      <button
                        type="button"
                        onClick={() => handleSwitchVoiceLanguage('ja-JP')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                          voiceLanguage === 'ja-JP'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="日本語で音声認識 (ja-JP)"
                      >
                        <span>🇯🇵</span>
                        <span>JP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchVoiceLanguage('en-US')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                          voiceLanguage === 'en-US'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        title="Recognize speech in English (en-US)"
                      >
                        <span>🇺🇸</span>
                        <span>EN</span>
                      </button>
                    </div>

                    <AudioWaveformVisualizer
                      stream={activeAudioStream}
                      isListening={isListening}
                      variant="compact"
                      barCount={12}
                      height={20}
                      showVolumeMeter={true}
                    />
                  </div>
                </div>

                {/* Center Large Command Popup on Trigger */}
                {triggeredCommand && (
                  <div className="py-1 px-2.5 bg-gradient-to-r from-emerald-900/80 via-teal-900/80 to-emerald-900/80 border border-emerald-400/60 rounded-lg flex items-center justify-center gap-2 animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="text-[10px] uppercase font-black bg-emerald-400 text-gray-950 px-1.5 py-0.5 rounded">
                      TRIGGERED
                    </span>
                    <span className="text-xs font-black text-white drop-shadow">
                      {triggeredCommand.label}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-1 text-[10px] pt-1 border-t border-white/10">
                  <span className="text-gray-400">
                    {voiceLanguage === 'en-US' ? 'Commands:' : '声で操作:'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded transition-all ${
                        triggeredCommand?.type === 'send'
                          ? 'bg-blue-500 text-white font-bold ring-2 ring-blue-300 scale-105'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {voiceLanguage === 'en-US' ? '"send"' : '「送信」'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded transition-all ${
                        triggeredCommand?.type === 'clear'
                          ? 'bg-amber-500 text-black font-bold ring-2 ring-amber-300 scale-105'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {voiceLanguage === 'en-US' ? '"clear"' : '「クリア」'}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded transition-all ${
                        triggeredCommand?.type === 'cancel'
                          ? 'bg-rose-500 text-white font-bold ring-2 ring-rose-300 scale-105'
                          : 'bg-white/10 text-gray-300'
                      }`}
                    >
                      {voiceLanguage === 'en-US' ? '"cancel"' : '「キャンセル」'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="ファイルを添付"
                >
                  <Paperclip size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  disabled={!isVoiceSupported}
                  className={`p-2 rounded-xl transition-all ${
                    !isVoiceSupported
                      ? 'text-gray-300 cursor-not-allowed'
                      : isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}
                  title={
                    !isVoiceSupported
                      ? 'このブラウザは音声認識に対応していません'
                      : isListening
                        ? '音声認識を停止'
                        : '音声で入力（周囲のノイズ自動低減）'
                  }
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`${activeModel} に質問・指示を入力...`}
                  className="flex-1 bg-gray-100 hover:bg-gray-100/80 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all text-gray-800"
                />

                <button
                  type="submit"
                  disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
                  className={`p-2.5 rounded-xl font-medium text-white transition-all cursor-pointer ${
                    (!input.trim() && attachedFiles.length === 0) || isTyping
                      ? 'bg-gray-300 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-xs'
                  }`}
                  title="送信"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
