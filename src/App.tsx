import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  Plus,
  Mic,
  MicOff,
  ArrowRight,
  ChevronDown,
  Share2,
  Check,
  Sparkles,
  Command,
  FileText,
  X,
  ShieldCheck,
  User,
  SlidersHorizontal,
  Wifi,
  Activity,
  Cpu,
  Search as SearchIcon,
  Camera,
  Grid,
  Globe,
  Image as ImageIcon,
  ShoppingBag,
  Video as VideoIcon,
  Newspaper,
  Flame,
  Compass,
} from 'lucide-react';

import {
  GeminiModel,
  SearchFilterState,
  SearchHistoryItem,
  StashedPage,
  SearchPreset,
  GoogleUserProfile,
  StatusMetrics,
  SearchCategory,
} from './types';

import { GlowBackground } from './components/GlowBackground';
import { Sidebar, ActiveModal } from './components/Sidebar';
import { FilterDropdown } from './components/FilterDropdown';
import { SearchHistoryModal } from './components/SearchHistoryModal';
import { CrossEngineModal } from './components/CrossEngineModal';
import { TabMemoryModal } from './components/TabMemoryModal';
import { AutoSearchEditorModal } from './components/AutoSearchEditorModal';
import { ApiCodeModal } from './components/ApiCodeModal';
import { PresetSaverModal } from './components/PresetSaverModal';
import { TabStashModal } from './components/TabStashModal';
import { SettingsModal } from './components/SettingsModal';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { GeminiDrawer } from './components/GeminiDrawer';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { SearchResults } from './components/SearchResults';
import { InAppBrowserModal } from './components/InAppBrowserModal';
import { AudioWaveformVisualizer } from './components/AudioWaveformVisualizer';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import { useSystemDiagnostics } from './hooks/useSystemDiagnostics';

export default function App() {
  // Main Search Input State
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('Gemini 3.8');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // In-App Web Viewer & Video Streamer State
  const [inAppBrowser, setInAppBrowser] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
  });

  const handleOpenInAppBrowser = (url: string, title?: string) => {
    setInAppBrowser({
      isOpen: true,
      url,
      title: title || 'Web Viewer',
    });
  };

  const handleCloseInAppBrowser = () => {
    setInAppBrowser((prev) => ({ ...prev, isOpen: false }));
  };

  // Multimodal Attachment State
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; type: string; size: string }[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active Sidebar Modal
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isGeminiDrawerOpen, setIsGeminiDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Visualizer bar / wave mode
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave'>('bars');
  const [voiceNoiseSuppressed] = useState(true);

  // Custom Background & Night Mode
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [customBgType, setCustomBgType] = useState<'image' | 'video' | null>(null);
  const [nightModeEnabled, setNightModeEnabled] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // TOP 7 Search Filter State
  const [filters, setFilters] = useState<SearchFilterState>({
    domainBlock: true,
    blockedDomains: [
      'sejuku.net',
      'qiita.com/spam',
      'zenn.dev/low-quality',
      'curation-matome.jp',
      'content-farm.com',
    ],
    exactTimeRange: false,
    timeStart: '',
    timeEnd: '',
    sideBySideCode: true,
    programmableOps: {
      minChars: 0,
      maxChars: 10000,
      langVersion: 'TypeScript 7.0',
      regexPattern: '',
    },
    pureCleanMode: false,
    paywallFilter: 'off',
    crossEngine: false,
  });

  // Active Category in Search Results Navigation ('all' | 'images' | 'shopping' | 'videos' | 'news' | 'shorts' | 'maps')
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  // Stashed Pages (Tab Stash - Starts completely empty from the start)
  const [stashedPages, setStashedPages] = useState<StashedPage[]>(() => {
    try {
      const saved = localStorage.getItem('myengine_stashed_pages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search History (Starts completely empty from the start)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('myengine_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Presets (Preset Saver - Starts completely empty from the start)
  const [presets, setPresets] = useState<SearchPreset[]>(() => {
    try {
      const saved = localStorage.getItem('myengine_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const GUEST_PROFILE: GoogleUserProfile = {
    email: '',
    name: 'ゲスト',
    picture: '',
    hd: '',
    sub: '',
    isLoggedIn: false,
  };

  // Google User Profile (starts as Guest initially until user registers/connects)
  const [userProfile, setUserProfile] = useState<GoogleUserProfile>(() => {
    try {
      const saved = localStorage.getItem('myengine_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.isLoggedIn === 'boolean') {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return GUEST_PROFILE;
  });

  const handleUpdateUserProfile = (updated: GoogleUserProfile) => {
    setUserProfile(updated);
    try {
      localStorage.setItem('myengine_user_profile', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Real-time System & Network Diagnostics hook (18s interval, pause on background tab)
  const { metrics, measureNow: refreshDiagnostics } = useSystemDiagnostics(18000);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Esc: Close all modals & drawers
      if (e.key === 'Escape') {
        setActiveModal(null);
        setFilterDropdownOpen(false);
        setModelDropdownOpen(false);
        setIsGeminiDrawerOpen(false);
        setIsCommandPaletteOpen(false);
        return;
      }

      // Cmd+K: Command Palette / Search focus
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Cmd+Shift+F: Toggle 🐍 Filter dropdown
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFilterDropdownOpen((prev) => !prev);
        return;
      }

      // Cmd+Shift+P: Toggle Pure Clean Mode
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setFilters((prev) => {
          const next = !prev.pureCleanMode;
          showToast(`Pure Clean モード: ${next ? 'ON (履歴非汚染)' : 'OFF'}`);
          return { ...prev, pureCleanMode: next };
        });
        return;
      }

      // Cmd+Enter: Instant Search
      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        handleExecuteSearch();
        return;
      }

      // Cmd+1 ~ 6: Gemini Model Switch
      if (isCmdOrCtrl && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        const models: GeminiModel[] = [
          'Gemini 3.8',
          'Gemini 3.1 Pro',
          'Gemini 3.7',
          'Gemini 3.5',
          'Gemini 3 Pro',
          'ナノバナナ',
        ];
        const chosen = models[parseInt(e.key, 10) - 1];
        if (chosen) {
          setSelectedModel(chosen);
          showToast(`モデル変更: ${chosen}`);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query, selectedModel, filters]);

  // Parse Permalink from URL Hash on Initial Load
  useEffect(() => {
    try {
      if (window.location.hash && window.location.hash.length > 1) {
        const hashStr = window.location.hash.substring(1);
        const params = new URLSearchParams(hashStr);
        const qParam = params.get('q');
        const mParam = params.get('m') as GeminiModel;
        const cleanParam = params.get('clean');

        if (qParam) {
          setQuery(qParam);
          setHasSearched(true);
        }
        if (mParam) {
          setSelectedModel(mParam);
        }
        if (cleanParam === '1') {
          setFilters((prev) => ({ ...prev, pureCleanMode: true }));
        }
        showToast('共有パーマリンクから検索条件を復元しました');
      }
    } catch {
      // ignore
    }
  }, []);

  // Execute Search Workflow
  const handleExecuteSearch = (explicitQuery?: string, explicitCategory?: SearchCategory) => {
    const target = typeof explicitQuery === 'string' ? explicitQuery : query;
    const trimmed = target.trim();
    if (!trimmed) return;

    if (typeof explicitQuery === 'string') {
      setQuery(explicitQuery);
    }
    if (explicitCategory) {
      setActiveCategory(explicitCategory);
    }
    setHasSearched(true);
    setFilterDropdownOpen(false);
    setModelDropdownOpen(false);

    // Save to history (clean duplicate queries)
    const newItem: SearchHistoryItem = {
      id: `hist-${Date.now()}`,
      query: trimmed,
      timestamp: new Date().toLocaleString('ja-JP'),
      model: selectedModel,
      filters: { ...filters },
    };

    setSearchHistory((prev) => {
      const updated = [newItem, ...prev.filter((h) => h.query !== trimmed).slice(0, 29)];
      try {
        localStorage.setItem('myengine_search_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // If crossEngine is on, also open cross engine modal
    if (filters.crossEngine) {
      setActiveModal('crossEngine');
    }
  };

  // Direct search from related questions or keywords
  const handleDirectSearch = (newQuery: string) => {
    setQuery(newQuery);
    handleExecuteSearch(newQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Multimodal File Handler
  const handleFileAttach = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type || 'file',
      size: `${(f.size / 1024).toFixed(1)} KB`,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    showToast(`${newFiles.length} 件のファイルを解析対象に添付しました`);
  };

  const preVoiceQueryRef = useRef<string>('');

  // Voice Recognition Hook (handles Web Speech API, noise suppression, timeouts, and multilingual switching)
  const {
    isListening,
    voiceLanguage,
    activeAudioStream,
    commandScreenFlash,
    triggeredCommand,
    isSupported: isVoiceSupported,
    handleToggleVoice: toggleVoiceRaw,
    setLanguage: setVoiceLanguage,
    cleanupVoiceRecognition,
    triggerCommandSuccess,
  } = useVoiceRecognition({
    initialLanguage: 'ja-JP',
    onTranscriptChange: (_interim, final) => {
      if (final.trim()) {
        setQuery(final.trim());
      }
    },
    onCommand: (cmd, rawText) => {
      if (cmd.type === 'cancel') {
        setQuery(preVoiceQueryRef.current);
        showToast(voiceLanguage === 'en-US' ? '✕ Voice cancelled' : '✕ 音声入力を取り消しました');
      } else if (cmd.type === 'clear') {
        setQuery('');
        showToast(voiceLanguage === 'en-US' ? '🧹 Cleared search bar' : '🧹 検索欄をクリアしました');
      } else if (cmd.type === 'stop') {
        showToast(voiceLanguage === 'en-US' ? '✓ Input finalized' : '✓ 音声入力を確定しました');
      } else if (cmd.type === 'ai') {
        setIsGeminiDrawerOpen(true);
        showToast(voiceLanguage === 'en-US' ? '✨ Gemini AI Chat opened' : '✨ Gemini AIチャットを起動しました');
      } else if (cmd.type === 'search') {
        // Parse possible category
        if (rawText.match(/(画像|写真|picture|image)/i)) {
          handleExecuteSearch(query || rawText, 'images');
        } else if (rawText.match(/(ショッピング|買い物|通販|shop)/i)) {
          handleExecuteSearch(query || rawText, 'shopping');
        } else if (rawText.match(/(動画|YouTube|アベマ|video)/i)) {
          handleExecuteSearch(query || rawText, 'videos');
        } else if (rawText.match(/(ショート|shorts)/i)) {
          handleExecuteSearch(query || rawText, 'shorts');
        } else if (rawText.match(/(ニュース|速報|news)/i)) {
          handleExecuteSearch(query || rawText, 'news');
        } else if (rawText.match(/(地図|マップ|map)/i)) {
          handleExecuteSearch(query || rawText, 'maps');
        } else {
          handleExecuteSearch(query || rawText);
        }
      }
    },
  });

  const handleToggleVoice = (overrideLang?: 'ja-JP' | 'en-US' | React.SyntheticEvent) => {
    if (!isVoiceSupported) {
      showToast('⚠️ お使いのブラウザはWeb Speech API（音声認識）に未対応です（Chrome / Edge / Safari推奨）');
      return;
    }
    preVoiceQueryRef.current = query;
    toggleVoiceRaw(overrideLang);
  };

  const handleSwitchVoiceLanguage = (newLang: 'ja-JP' | 'en-US') => {
    setVoiceLanguage(newLang);
    showToast(newLang === 'en-US' ? '🇺🇸 Voice recognition set to English (en-US)' : '🇯🇵 音声認識言語を日本語（ja-JP）に切り替えました');
  };

  const handleVoiceCommandAction = (commandText: string) => {
    const normalized = commandText.toLowerCase();
    if (normalized === '検索' || normalized === 'search') {
      triggerCommandSuccess({ type: 'search', label: voiceLanguage === 'en-US' ? 'Search' : '検索' });
      handleExecuteSearch();
    } else if (normalized === 'クリア' || normalized === 'clear') {
      triggerCommandSuccess({ type: 'clear', label: voiceLanguage === 'en-US' ? 'Clear' : 'クリア' });
      setQuery('');
    } else if (normalized === '終了' || normalized === 'finish') {
      triggerCommandSuccess({ type: 'stop', label: voiceLanguage === 'en-US' ? 'Done' : '終了' });
      cleanupVoiceRecognition();
    } else if (normalized === 'キャンセル' || normalized === 'cancel') {
      triggerCommandSuccess({ type: 'cancel', label: voiceLanguage === 'en-US' ? 'Cancel' : 'キャンセル' });
      setQuery(preVoiceQueryRef.current);
      cleanupVoiceRecognition();
    } else if (normalized === 'ai' || normalized === 'ask ai') {
      triggerCommandSuccess({ type: 'ai', label: 'Gemini AI' });
      setIsGeminiDrawerOpen(true);
    }
  };

  // Generate Permalink
  const handleSharePermalink = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('m', selectedModel);
    if (filters.pureCleanMode) params.set('clean', '1');
    if (filters.domainBlock) params.set('block', '1');

    const shareUrl = `${window.location.origin}${window.location.pathname}#${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
    showToast('検索パーマリンクをクリップボードにコピーしました！');
  };

  // Stash page helper
  const handleStashPage = (title: string, url: string, snippet: string, category: string) => {
    const newPage: StashedPage = {
      id: `stash-${Date.now()}`,
      title,
      url,
      snippet,
      stashedAt: 'たった今',
      category,
    };
    setStashedPages((prev) => {
      const updated = [newPage, ...prev];
      try {
        localStorage.setItem('myengine_stashed_pages', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast(`Tab Stashに「${title.slice(0, 16)}...」を保存しました`);
  };

  // Block domain helper
  const handleBlockDomain = (domain: string) => {
    if (!filters.blockedDomains.includes(domain)) {
      setFilters((prev) => ({
        ...prev,
        domainBlock: true,
        blockedDomains: [domain, ...prev.blockedDomains],
      }));
      showToast(`「${domain}」をブロックリストに追加しました`);
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-gray-900 bg-transparent flex flex-col pl-16 selection:bg-blue-100 selection:text-blue-900">
      {/* 2. Central Glow & Custom Background Manager */}
      <GlowBackground
        customBgUrl={customBgUrl}
        customBgType={customBgType}
        isTyping={isTyping}
        nightModeEnabled={nightModeEnabled}
      />

      {/* 3. A. Left Vertical Rail Toolbar */}
      <Sidebar
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        stashedCount={stashedPages.length}
        userProfile={userProfile}
        pureCleanActive={filters.pureCleanMode}
      />

      {/* Condition A: Google Search Results Mode (Matches image.png) */}
      {hasSearched ? (
        <div className="flex-1 flex flex-col w-full bg-white z-20">
          {/* Google Results Top Sticky Header */}
          <header className="sticky top-0 bg-white border-b border-gray-200 z-30 shadow-2xs">
            {/* Top Row: Google Logo + Search Capsule Bar + Right User Tools */}
            <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-3 sm:gap-6">
              {/* Left: Google Logo + Search Bar */}
              <div className="flex items-center gap-4 sm:gap-6 flex-1 max-w-3xl">
                {/* Google Logo (Click to return to home cockpit) */}
                <button
                  type="button"
                  onClick={() => {
                    setHasSearched(false);
                  }}
                  className="flex items-center text-2xl sm:text-[26px] font-bold tracking-tight select-none cursor-pointer pr-1 shrink-0 hover:opacity-90 transition-opacity"
                  title="ホームに戻る"
                >
                  <span className="text-[#4285F4]">G</span>
                  <span className="text-[#EA4335]">o</span>
                  <span className="text-[#FBBC05]">o</span>
                  <span className="text-[#4285F4]">g</span>
                  <span className="text-[#34A853]">l</span>
                  <span className="text-[#EA4335]">e</span>
                </button>

                {/* Google Pill Search Bar (Matching image.png) */}
                <div className="flex-1 flex items-center bg-white rounded-full border border-gray-200 shadow-[0_1px_6px_rgba(32,33,36,0.22)] hover:shadow-[0_1px_6px_rgba(32,33,36,0.3)] px-4 py-2 text-sm transition-shadow">
                  <input
                    title={isVoiceSupported ? '音声で検索' : 'このブラウザは音声認識に対応していません'}
                    disabled={!isVoiceSupported}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleExecuteSearch();
                      }
                    }}
                    placeholder="Google で検索または URL を入力"
                    className="flex-1 bg-transparent text-[#202124] text-base focus:outline-none"
                  />

                  {/* Clear Button ✕ */}
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="text-gray-400 hover:text-gray-700 p-1 mr-1 transition-colors"
                      title="クリア"
                    >
                      <X size={18} />
                    </button>
                  )}

                  {/* Vertical Divider */}
                  <div className="w-px h-5 bg-gray-300 mx-1.5 shrink-0" />
                      title={isVoiceSupported ? '音声で検索' : 'このブラウザは音声認識に対応していません'}
                      disabled={!isVoiceSupported}
                  {/* Voice Search Mic Icon */}
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`p-1.5 rounded-full transition-colors ${
                      isListening
                        ? 'text-rose-500 bg-rose-50 animate-pulse'
                        : 'text-[#4285F4] hover:bg-gray-100'
                    }`}
                    title="音声で検索"
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Google Lens Camera Icon */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-full text-[#4285F4] hover:bg-gray-100 transition-colors"
                    title="画像で検索 (Google レンズ)"
                  >
                    <Camera size={18} />
                  </button>

                  {/* Search Magnifying Glass Icon */}
                  <button
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    className="p-1.5 rounded-full text-[#4285F4] hover:bg-blue-50 transition-colors ml-0.5"
                    title="検索"
                  >
                    <SearchIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Right: Share + Google Apps Grid + User Account Avatar */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Share URL */}
                <button
                  type="button"
                  onClick={handleSharePermalink}
                  className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex"
                  title="検索条件リンクを共有"
                >
                  <Share2 size={18} />
                </button>

                {/* 9-dot Google Apps grid (Command Palette) */}
                <button
                  type="button"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Google アプリ / コマンドパレット (Cmd+K)"
                >
                  <Grid size={20} />
                </button>

                {/* Profile Icon: Orange circle with "A" as in image.png, or user photo */}
                <button
                  type="button"
                  onClick={() => setActiveModal('googleAuth')}
                  className="relative group cursor-pointer"
                  title={
                    userProfile.isLoggedIn
                      ? `${userProfile.name} (${userProfile.email})`
                      : 'Google アカウントでログイン'
                  }
                >
                  {userProfile.isLoggedIn && userProfile.picture ? (
                    <img
                      src={userProfile.picture}
                      alt={userProfile.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-2xs"
                    />
                  ) : userProfile.isLoggedIn && userProfile.name ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-2xs select-none">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-600 flex items-center justify-center shadow-2xs transition-colors" title="ログイン">
                      <User size={16} />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom Row: Category Navigation Tabs (Directly matches image.png) */}
            <div className="px-4 sm:px-6 flex items-center gap-6 text-[13px] sm:text-sm text-[#5f6368] overflow-x-auto select-none no-scrollbar">
              {/* AI モード (Opens Gemini Drawer) */}
              <button
                type="button"
                onClick={() => setIsGeminiDrawerOpen(true)}
                className="flex items-center gap-1.5 pb-2.5 text-[#1a73e8] hover:text-[#174ea6] font-medium transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles size={16} className="text-[#1a73e8]" />
                <span>AI モード</span>
              </button>

              {/* すべて */}
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`flex items-center gap-1.5 pb-2.5 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === 'all'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                <span>すべて</span>
              </button>

              {/* ショッピング */}
              <button
                type="button"
                onClick={() => setActiveCategory('shopping')}
                className={`pb-2.5 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeCategory === 'shopping'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                ショッピング
              </button>

              {/* 画像 */}
              <button
                type="button"
                onClick={() => setActiveCategory('images')}
                className={`pb-2.5 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeCategory === 'images'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                画像
              </button>

              {/* 動画 */}
              <button
                type="button"
                onClick={() => setActiveCategory('videos')}
                className={`pb-2.5 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeCategory === 'videos'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                動画
              </button>

              {/* ニュース */}
              <button
                type="button"
                onClick={() => setActiveCategory('news')}
                className={`pb-2.5 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeCategory === 'news'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                ニュース
              </button>

              {/* ショート動画 */}
              <button
                type="button"
                onClick={() => setActiveCategory('shorts')}
                className={`pb-2.5 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeCategory === 'shorts'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                ショート動画
              </button>

              {/* 地図 */}
              <button
                type="button"
                onClick={() => setActiveCategory('maps')}
                className={`pb-2.5 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  activeCategory === 'maps'
                    ? 'text-[#202124] border-b-[3px] border-[#202124]'
                    : 'hover:text-[#202124]'
                }`}
              >
                地図
              </button>

              {/* ツール (FilterDropdown toggle) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                  className={`pb-2.5 transition-colors whitespace-nowrap flex items-center gap-1 font-medium cursor-pointer ${
                    filterDropdownOpen ? 'text-[#1a73e8]' : 'hover:text-[#202124]'
                  }`}
                >
                  <span>ツール</span>
                  <ChevronDown size={14} />
                </button>
                <FilterDropdown
                  isOpen={filterDropdownOpen}
                  onClose={() => setFilterDropdownOpen(false)}
                  filters={filters}
                  setFilters={setFilters}
                  onOpenSettingsBlacklist={() => setActiveModal('settings')}
                  onOpenCrossEngine={() => setActiveModal('crossEngine')}
                />
              </div>
            </div>
          </header>

          {/* Search Results Display Area (Scrollable, Link-Clickable) */}
          <SearchResults
            query={query}
            model={selectedModel}
            filters={filters}
            activeCategory={activeCategory}
            onSelectCategory={(cat) => setActiveCategory(cat)}
            onStashPage={handleStashPage}
            onBlockDomain={handleBlockDomain}
            onOpenGeminiDrawer={() => setIsGeminiDrawerOpen(true)}
            onSearchQuery={handleDirectSearch}
            onOpenInAppBrowser={handleOpenInAppBrowser}
          />
        </div>
      ) : (
        /* Condition B: Main Center Cockpit Home Screen ("何から検索しますか？") */
        <div className="flex-1 flex flex-col w-full">
          {/* Top Header Floating Utility */}
          <header className="w-full flex items-center justify-between px-6 py-4 z-20 select-none">
            <div className="flex items-center gap-2">
              {filters.pureCleanMode && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-2.5 py-1 rounded-full backdrop-blur-xs font-medium">
                  <ShieldCheck size={13} />
                  <span>Pure Clean モード稼働中</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSharePermalink}
                className="text-xs text-gray-500 hover:text-gray-900 bg-white/70 hover:bg-white border border-gray-200/70 px-3 py-1.5 rounded-xl shadow-2xs backdrop-blur-xs transition-all flex items-center gap-1.5 active:scale-95"
                title="現在の検索条件を共有URLとしてコピー"
              >
                <Share2 size={13} />
                <span className="hidden sm:inline">条件リンク共有</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className="text-xs text-gray-400 hover:text-gray-700 bg-white/70 hover:bg-white border border-gray-200/70 px-2.5 py-1.5 rounded-xl shadow-2xs backdrop-blur-xs transition-all flex items-center gap-1.5 group active:scale-95"
              >
                <Command size={13} className="text-gray-400 group-hover:text-gray-700" />
                <span className="font-mono text-[11px] font-medium">Cmd+K</span>
              </button>

              <button
                type="button"
                id="header-user-btn"
                onClick={() => setActiveModal('googleAuth')}
                className={`text-xs px-2.5 py-1.5 rounded-xl border shadow-2xs backdrop-blur-xs transition-all flex items-center gap-2 active:scale-95 ${
                  userProfile.isLoggedIn
                    ? 'bg-white/90 hover:bg-white border-gray-200 text-gray-800'
                    : 'bg-white/70 hover:bg-white border-gray-200/80 text-gray-600 hover:text-gray-900 group'
                }`}
                title={
                  userProfile.isLoggedIn
                    ? `Googleアカウント: ${userProfile.name} (${userProfile.email})`
                    : 'ゲストアカウント (クリックしてログイン)'
                }
              >
                {userProfile.isLoggedIn ? (
                  <>
                    {userProfile.picture ? (
                      <img
                        src={userProfile.picture}
                        alt={userProfile.name}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-gray-200/80 shadow-xs"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {userProfile.name
                          ? userProfile.name.charAt(0).toUpperCase()
                          : userProfile.email
                          ? userProfile.email.charAt(0).toUpperCase()
                          : 'U'}
                      </div>
                    )}
                    <span className="font-semibold text-xs text-gray-800 hidden sm:inline">
                      {userProfile.name}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                      <User size={12} />
                    </div>
                    <span className="font-medium text-gray-600 text-xs">ゲスト</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 font-medium px-1.5 py-0.2 rounded-full hidden sm:inline">
                      登録
                    </span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* Main Center Cockpit */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-8 z-20">
            <div className="text-center mb-6">
              <h1
                id="main-title"
                className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-800"
              >
                何から検索しますか？
              </h1>
            </div>

            {/* Home Category Pill Selector */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto max-w-2xl w-full justify-start sm:justify-center px-2 py-1 scrollbar-none">
              {[
                { id: 'all', label: 'すべて', icon: SearchIcon },
                { id: 'images', label: '写真・画像', icon: ImageIcon },
                { id: 'shopping', label: 'ショッピング', icon: ShoppingBag },
                { id: 'videos', label: '動画', icon: VideoIcon },
                { id: 'shorts', label: 'ショート動画', icon: Flame },
                { id: 'news', label: 'ニュース', icon: Newspaper },
                { id: 'maps', label: '地図', icon: Compass },
              ].map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as SearchCategory)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold scale-105'
                        : 'bg-white/80 hover:bg-white text-gray-700 border border-gray-200/80 shadow-2xs backdrop-blur-xs'
                    }`}
                  >
                    <IconComponent size={13} className={isActive ? 'text-white' : 'text-gray-500'} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 検索カプセル */}
            <div
              id="search-capsule-bar"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDraggingOver(false);
                handleFileAttach(e.dataTransfer.files);
              }}
              className={`w-full max-w-2xl bg-white/85 backdrop-blur-md rounded-3xl border transition-all duration-300 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_32px_rgba(0,0,0,0.06)] relative ${
                isDraggingOver
                  ? 'border-blue-500 ring-4 ring-blue-100/80 bg-white/95'
                  : 'border-white hover:border-gray-200/80'
              }`}
            >
              <div className="p-3 sm:p-4 pb-2">
                {attachedFiles.length > 0 && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                    {attachedFiles.map((file, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-blue-50/90 text-blue-800 border border-blue-200/80 px-2.5 py-0.5 rounded-full font-medium shadow-2xs"
                      >
                        <FileText size={12} className="text-blue-600" />
                        <span className="truncate max-w-[140px]">{file.name}</span>
                        <span className="text-[9px] text-blue-500 font-mono">({file.size})</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-blue-400 hover:text-blue-800 ml-0.5"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
                    title="画像・ドキュメントを添付"
                    aria-label="ファイル添付"
                  >
                    <Plus size={18} strokeWidth={2} />
                  </button>

                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setIsTyping(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleExecuteSearch();
                      }
                    }}
                    placeholder="クエリ、URL、または条件を入力..."
                    className="w-full bg-transparent text-sm sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none font-normal leading-relaxed"
                  />
                </div>
              </div>

              {/* 下段ツールバー */}
              <div className="px-3 sm:px-4 py-2.5 border-t border-gray-100/80 flex items-center justify-between text-xs select-none">
                <div className="relative">
                  <button
                    id="filter-toggle-btn"
                    type="button"
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium ${
                      filterDropdownOpen
                        ? 'bg-gray-900 text-white shadow-xs'
                        : 'bg-gray-100/70 text-gray-700 hover:bg-gray-200/80 active:scale-95'
                    }`}
                  >
                    <SlidersHorizontal size={13} className={filterDropdownOpen ? 'text-white' : 'text-gray-500'} />
                    <span>フィルター</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        filterDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <FilterDropdown
                    isOpen={filterDropdownOpen}
                    onClose={() => setFilterDropdownOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                    onOpenSettingsBlacklist={() => setActiveModal('settings')}
                    onOpenCrossEngine={() => setActiveModal('crossEngine')}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <button
                      id="model-selector-btn"
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70 flex items-center gap-1 font-medium transition-all text-xs"
                    >
                      <span>{selectedModel}</span>
                      <ChevronDown size={12} className="text-gray-400" />
                    </button>

                    {modelDropdownOpen && (
                      <div className="absolute right-0 bottom-full mb-2 w-44 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                        <div className="text-[10px] text-gray-400 px-2 py-1 font-medium">
                          推論モデル選択
                        </div>
                        {(
                          [
                            'Gemini 3.8',
                            'Gemini 3.1 Pro',
                            'Gemini 3.7',
                            'Gemini 3.5',
                            'Gemini 3 Pro',
                            'ナノバナナ',
                          ] as GeminiModel[]
                        ).map((m, idx) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setSelectedModel(m);
                              setModelDropdownOpen(false);
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                              selectedModel === m
                                ? 'bg-gray-900 text-white font-medium'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{m}</span>
                              {m === 'Gemini 3.1 Pro' && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-semibold">PRO</span>
                              )}
                            </div>
                            <span className="text-[10px] opacity-60 font-mono">
                              {idx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                    title="音声入力"
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>

                  <button
                    id="search-submit-btn"
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    disabled={!query.trim()}
                    className="w-8 h-8 rounded-full bg-gray-900 text-white hover:bg-black disabled:opacity-30 disabled:hover:bg-gray-900 flex items-center justify-center transition-all shadow-xs active:scale-95"
                    title="検索を実行"
                  >
                    <ArrowRight size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {/* クイック検索キーワード (実在する正規の検索に遷移) */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-xl">
              {[
                { label: '🎮 無料ゲーム', q: '無料ゲーム' },
                { label: '☀️ 今日の天気', q: '天気' },
                { label: '📰 最新ニュース', q: 'ニュース' },
                { label: '📺 YouTube おすすめ', q: 'YouTube' },
                { label: '🛒 Amazon ショッピング', q: 'Amazon' },
              ].map((chip) => (
                <button
                  key={chip.q}
                  type="button"
                  onClick={() => handleExecuteSearch(chip.q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/70 hover:bg-white text-gray-700 hover:text-black border border-gray-200/80 shadow-2xs backdrop-blur-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </main>
        </div>
      )}

      {/* 3. C. 右側スライドインパネル: Gemini対話＆ファイル転送ドロワー */}
      <GeminiDrawer
        isOpen={isGeminiDrawerOpen}
        onClose={() => setIsGeminiDrawerOpen(false)}
        activeModel={selectedModel}
        currentQuery={query}
        onSelectModel={(model) => setSelectedModel(model)}
        onSearchQuery={(searchQuery) => handleExecuteSearch(searchQuery)}
      />

      {/* 3. D. 右下インフラ＆パフォーマンスステータス (モノスペースフォント・実測リアルタイム) */}
      <footer
        id="status-metrics-footer"
        className="fixed bottom-3 right-4 z-30 select-none pointer-events-none"
      >
        <div className="bg-white/85 backdrop-blur-md border border-gray-200/90 rounded-xl px-3 py-1.5 shadow-2xs text-[11px] font-mono text-gray-600 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                metrics.isOnline !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <Wifi size={12} className={metrics.isOnline !== false ? 'text-gray-400' : 'text-rose-500'} />
            <span className={metrics.isOnline === false ? 'text-rose-600 font-semibold' : ''}>
              {metrics.bandwidth}
            </span>
            <span className="text-gray-300">|</span>
            <span>Ping {metrics.isOnline !== false ? `${metrics.ping}ms` : '-'}</span>
            <span className="text-gray-300">|</span>
            <Activity size={12} className="text-gray-400" />
            <span>{metrics.isOnline !== false ? `${metrics.domainResponseMs}ms` : '-'}</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className="text-gray-400" />
            <span title={`DOMノード数: ${metrics.domNodesCount || 0} / 実測ヒープ: ${metrics.usedHeapMb || 0} MB`}>
              RAM {metrics.usedHeapMb ? `${metrics.usedHeapMb}MB` : `${metrics.ramUsedGb}GB`} / {metrics.ramTotalGb}GB
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Gemini Drawer Trigger Button */}
      <div className="fixed right-4 bottom-14 z-30">
        <button
          type="button"
          onClick={() => setIsGeminiDrawerOpen(true)}
          className="p-3 bg-white/90 hover:bg-white text-gray-800 hover:text-black rounded-2xl shadow-lg border border-gray-200/90 transition-all active:scale-95 flex items-center gap-2 group backdrop-blur-md"
          title="Gemini対話＆ファイル転送ドロワーを開く"
        >
          <Sparkles size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold pr-1">Gemini Drawer</span>
        </button>
      </div>

      {/* Modals */}
      <SearchHistoryModal
        isOpen={activeModal === 'history'}
        onClose={() => setActiveModal(null)}
        history={searchHistory}
        onSelectQuery={(selectedQ) => {
          setQuery(selectedQ);
          setHasSearched(true);
        }}
        onClearHistory={() => {
          setSearchHistory([]);
          try {
            localStorage.removeItem('myengine_search_history');
          } catch {
            // ignore
          }
          showToast('検索履歴をすべて削除しました');
        }}
      />

      <CrossEngineModal
        isOpen={activeModal === 'crossEngine'}
        onClose={() => setActiveModal(null)}
        query={query}
        onStashPage={handleStashPage}
      />

      <TabMemoryModal
        isOpen={activeModal === 'tabMemory'}
        onClose={() => setActiveModal(null)}
        currentQuery={query}
      />

      <AutoSearchEditorModal
        isOpen={activeModal === 'autoSearch'}
        onClose={() => setActiveModal(null)}
        currentQuery={query}
      />

      <ApiCodeModal
        isOpen={activeModal === 'apiCode'}
        onClose={() => setActiveModal(null)}
        query={query}
        model={selectedModel}
        filters={filters}
      />

      <PresetSaverModal
        isOpen={activeModal === 'presetSaver'}
        onClose={() => setActiveModal(null)}
        currentQuery={query}
        currentModel={selectedModel}
        currentFilters={filters}
        presets={presets}
        onSavePreset={(newP) => {
          setPresets((prev) => {
            const updated = [newP, ...prev];
            try {
              localStorage.setItem('myengine_presets', JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          showToast(`プリセット「${newP.name}」を保存しました`);
        }}
        onLoadPreset={(loaded) => {
          setSelectedModel(loaded.model);
          setFilters(loaded.filters);
          if (loaded.sampleQuery) setQuery(loaded.sampleQuery);
          showToast(`プリセット「${loaded.name}」を適用しました`);
        }}
        onDeletePreset={(id) => {
          setPresets((prev) => {
            const updated = prev.filter((p) => p.id !== id);
            try {
              localStorage.setItem('myengine_presets', JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          showToast('プリセットを削除しました');
        }}
      />

      <TabStashModal
        isOpen={activeModal === 'tabStash'}
        onClose={() => setActiveModal(null)}
        stashedPages={stashedPages}
        onRemovePage={(id) => {
          setStashedPages((prev) => {
            const updated = prev.filter((p) => p.id !== id);
            try {
              localStorage.setItem('myengine_stashed_pages', JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }}
        onClearAll={() => {
          setStashedPages([]);
          try {
            localStorage.removeItem('myengine_stashed_pages');
          } catch {
            // ignore
          }
          showToast('Tab Stashをすべてクリアしました');
        }}
        onAnalyzeWithGemini={() => {
          setIsGeminiDrawerOpen(true);
        }}
      />

      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        blockedDomains={filters.blockedDomains}
        onAddBlockedDomain={handleBlockDomain}
        onRemoveBlockedDomain={(dom) =>
          setFilters((prev) => ({
            ...prev,
            blockedDomains: prev.blockedDomains.filter((d) => d !== dom),
          }))
        }
        customBgUrl={customBgUrl}
        customBgType={customBgType}
        onSetCustomBackground={(url, type) => {
          setCustomBgUrl(url);
          setCustomBgType(type);
        }}
        nightModeEnabled={nightModeEnabled}
        onToggleNightMode={() => setNightModeEnabled(!nightModeEnabled)}
        onClearAllCache={() => {
          setSearchHistory([]);
          setStashedPages([]);
          setPresets([]);
          try {
            localStorage.removeItem('myengine_search_history');
            localStorage.removeItem('myengine_stashed_pages');
            localStorage.removeItem('myengine_presets');
          } catch {
            // ignore
          }
          showToast('すべての履歴・ストック・プリセットキャッシュを消去しました');
        }}
      />

      <GoogleAuthModal
        isOpen={activeModal === 'googleAuth'}
        onClose={() => setActiveModal(null)}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateUserProfile}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={(act) => setActiveModal(act as ActiveModal)}
        onSelectModel={(mod) => setSelectedModel(mod)}
        onToggleFilter={() => setFilterDropdownOpen((prev) => !prev)}
        onTogglePureClean={() =>
          setFilters((prev) => ({ ...prev, pureCleanMode: !prev.pureCleanMode }))
        }
        onSharePermalink={handleSharePermalink}
      />

      {/* In-App Web Viewer & Video Streamer Modal */}
      <InAppBrowserModal
        isOpen={inAppBrowser.isOpen}
        onClose={handleCloseInAppBrowser}
        initialUrl={inAppBrowser.url}
        initialTitle={inAppBrowser.title}
        onOpenGeminiWithContext={(url, title) => {
          setIsGeminiDrawerOpen(true);
        }}
      />

      {/* Fullscreen Subtle Emerald Flash Overlay on Command Trigger */}
      {commandScreenFlash && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[9999] pointer-events-none bg-emerald-500/20 ring-[12px] ring-inset ring-emerald-400/50 backdrop-blur-[1px] transition-all duration-300 animate-in fade-in"
        />
      )}

      {/* Voice Recognition Active HUD Overlay */}
      {isListening && (
        <div
          id="voice-recognition-hud"
          className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-gray-950/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-200 flex flex-col gap-2.5 max-w-lg w-[94vw] sm:w-auto transition-all ${
            triggeredCommand
              ? 'border-2 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.5)] ring-4 ring-emerald-500/30 scale-102'
              : 'border border-blue-500/40 shadow-blue-500/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  triggeredCommand
                    ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/50 animate-pulse'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                }`}
              >
                {triggeredCommand ? <Check size={20} className="stroke-[3]" /> : <Mic size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">
                    {triggeredCommand ? '⚡ コマンド実行中' : 'リアルタイム音声認識中'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                      triggeredCommand
                        ? 'bg-emerald-400 text-gray-950 font-black animate-pulse'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {triggeredCommand ? `✓ ${triggeredCommand.label}` : '🛡️ ノイズ低減 ON'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {triggeredCommand
                    ? 'アクションを即時トリガーしています...'
                    : '話しかけてください（沈黙 2.4s で自動確定）'}
                </p>
              </div>
            </div>

            {/* Web Audio API Real-time Waveform Visualizer, Language Switcher & Mode Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Dynamic Language Switcher (ja-JP / en-US) */}
              <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSwitchVoiceLanguage('ja-JP')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    voiceLanguage === 'ja-JP'
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
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
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    voiceLanguage === 'en-US'
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
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
                variant={visualizerMode}
                barCount={20}
                height={28}
                showVolumeMeter={true}
              />

              {/* Mode Toggle Button (Bars / Wave) */}
              <button
                type="button"
                onClick={() => setVisualizerMode((prev) => (prev === 'bars' ? 'wave' : 'bars'))}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-[10px] font-mono border border-white/10 transition-colors cursor-pointer"
                title={`波形表示モード切り替え (現在: ${visualizerMode === 'bars' ? 'イコライザー' : 'オシロスコープ'})`}
              >
                {visualizerMode === 'bars' ? 'EQ' : 'WAVE'}
              </button>
            </div>
          </div>

          {/* Transcribed Text Preview with Large Center Command Popup Banner */}
          <div
            className={`rounded-xl px-3.5 py-2.5 min-h-[44px] flex items-center justify-center font-mono border transition-all duration-300 relative overflow-hidden ${
              triggeredCommand
                ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 text-emerald-100 border-2 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.5)] ring-4 ring-emerald-500/30 scale-102 animate-in zoom-in-95 duration-200'
                : 'bg-white/10 text-gray-200 border-white/5'
            }`}
          >
            {triggeredCommand ? (
              <div className="flex items-center gap-2.5 py-0.5 animate-bounce">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400 text-gray-950 font-black shadow-xs">
                    {voiceLanguage === 'en-US' ? 'TRIGGERED' : 'コマンド検出'}
                  </span>
                  <span className="text-sm sm:text-base font-black text-white tracking-wide drop-shadow-md">
                    {triggeredCommand.label}
                  </span>
                </div>
              </div>
            ) : query ? (
              <div className="w-full text-left">
                <span className="text-white text-xs sm:text-sm font-medium break-all">{query}</span>
              </div>
            ) : (
              <div className="w-full text-left">
                <span className="text-gray-400 text-xs italic">
                  {voiceLanguage === 'en-US' ? 'Listening to speech...' : '音声を聞き取っています...'}
                </span>
              </div>
            )}
          </div>

          {/* Voice Command Shortcuts & Quick Trigger Badges with Highlight Animation */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none text-[10px]">
            <span className="text-gray-400 font-medium shrink-0">
              {voiceLanguage === 'en-US' ? '🗣️ Commands:' : '🗣️ 声で操作:'}
            </span>
            <button
              type="button"
              onClick={() => handleVoiceCommandAction(voiceLanguage === 'en-US' ? 'search' : '検索')}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition-all duration-200 ${
                triggeredCommand?.type === 'search'
                  ? 'bg-blue-500 text-white font-bold ring-4 ring-blue-400/80 scale-110 shadow-lg shadow-blue-500/50 animate-pulse'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
              }`}
            >
              {triggeredCommand?.type === 'search'
                ? voiceLanguage === 'en-US' ? '⚡ Searching...' : '⚡ 検索中...'
                : voiceLanguage === 'en-US' ? '"search for ~"' : '「〜を検索」'}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandAction(voiceLanguage === 'en-US' ? 'clear' : 'クリア')}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition-all duration-200 ${
                triggeredCommand?.type === 'clear'
                  ? 'bg-amber-500 text-gray-950 font-bold ring-4 ring-amber-400/80 scale-110 shadow-lg shadow-amber-500/50 animate-pulse'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
              }`}
            >
              {triggeredCommand?.type === 'clear'
                ? voiceLanguage === 'en-US' ? '🧹 Clearing...' : '🧹 消去中...'
                : voiceLanguage === 'en-US' ? '"clear"' : '「クリア」'}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandAction(voiceLanguage === 'en-US' ? 'finish' : '終了')}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition-all duration-200 ${
                triggeredCommand?.type === 'stop'
                  ? 'bg-emerald-500 text-white font-bold ring-4 ring-emerald-400/80 scale-110 shadow-lg shadow-emerald-500/50 animate-pulse'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {triggeredCommand?.type === 'stop'
                ? voiceLanguage === 'en-US' ? '✓ Done...' : '✓ 確定中...'
                : voiceLanguage === 'en-US' ? '"done / stop"' : '「終了」'}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandAction(voiceLanguage === 'en-US' ? 'cancel' : 'キャンセル')}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition-all duration-200 ${
                triggeredCommand?.type === 'cancel'
                  ? 'bg-rose-500 text-white font-bold ring-4 ring-rose-400/80 scale-110 shadow-lg shadow-rose-500/50 animate-pulse'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
              }`}
            >
              {triggeredCommand?.type === 'cancel'
                ? voiceLanguage === 'en-US' ? '✕ Cancelling...' : '✕ 取消中...'
                : voiceLanguage === 'en-US' ? '"cancel"' : '「キャンセル」'}
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandAction(voiceLanguage === 'en-US' ? 'ask ai' : 'AI')}
              className={`px-2 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition-all duration-200 ${
                triggeredCommand?.type === 'ai'
                  ? 'bg-purple-500 text-white font-bold ring-4 ring-purple-400/80 scale-110 shadow-lg shadow-purple-500/50 animate-pulse'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
              }`}
            >
              {triggeredCommand?.type === 'ai'
                ? voiceLanguage === 'en-US' ? '✨ Launching AI...' : '✨ AI起動中...'
                : voiceLanguage === 'en-US' ? '"ask ai"' : '「AI起動」'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                cleanupVoiceRecognition();
                showToast('音声認識をキャンセルしました');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => {
                cleanupVoiceRecognition();
                if (query.trim()) {
                  handleExecuteSearch();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={13} />
              <span>確定して検索</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          id="global-toast"
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md select-none"
        >
          <Check size={14} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
