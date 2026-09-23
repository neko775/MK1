import { useState, useRef, useCallback, useEffect } from 'react';

export interface TriggeredCommand {
  type: 'search' | 'clear' | 'stop' | 'cancel' | 'ai' | 'send';
  label: string;
}

export interface UseVoiceRecognitionOptions {
  initialLanguage?: 'ja-JP' | 'en-US';
  onCommand?: (command: TriggeredCommand, rawText: string) => void;
  onTranscriptChange?: (interim: string, final: string) => void;
  silenceTimeoutMs?: number;
  maxDurationMs?: number;
}

export function useVoiceRecognition(options: UseVoiceRecognitionOptions = {}) {
  const {
    initialLanguage = 'ja-JP',
    onCommand,
    onTranscriptChange,
    silenceTimeoutMs = 2400,
    maxDurationMs = 35000,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<'ja-JP' | 'en-US'>(initialLanguage);
  const [activeAudioStream, setActiveAudioStream] = useState<MediaStream | null>(null);
  const [commandScreenFlash, setCommandScreenFlash] = useState(false);
  const [triggeredCommand, setTriggeredCommand] = useState<TriggeredCommand | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check Web Speech API availability on mount
  useEffect(() => {
    const hasSpeech = Boolean(
      typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
    setIsSupported(hasSpeech);
  }, []);

  const triggerCommandSuccess = useCallback((cmd: TriggeredCommand) => {
    setTriggeredCommand(cmd);
    setCommandScreenFlash(true);
    setTimeout(() => {
      setCommandScreenFlash(false);
    }, 650);
  }, []);

  const parseCommand = useCallback((rawText: string): TriggeredCommand | null => {
    const raw = rawText.trim();
    if (!raw) return null;
    if (/^(キャンセル|やめて|取り消し|cancel|abort)$/i.test(raw)) {
      return { type: 'cancel', label: voiceLanguage === 'en-US' ? 'Cancel' : 'キャンセル' };
    }
    if (/^(クリア|消して|全部消して|clear|clear all|reset|erase)$/i.test(raw)) {
      return { type: 'clear', label: voiceLanguage === 'en-US' ? 'Clear' : 'クリア' };
    }
    if (/^(終了|ストップ|完了|終わり|stop|finish|done|complete)$/i.test(raw)) {
      return { type: 'stop', label: voiceLanguage === 'en-US' ? 'Done' : '終了' };
    }
    if (/^(ai|gemini|ジェミニ|チャット)$/i.test(raw)) {
      return { type: 'ai', label: 'Gemini AI' };
    }
    if (/^(送信|そうしん|send|submit)$/i.test(raw)) {
      return { type: 'send', label: voiceLanguage === 'en-US' ? 'Send' : '送信' };
    }
    if (/^(検索|調べて|search|go)$/i.test(raw) || /(?:で|を)?検索して$/i.test(raw)) {
      return { type: 'search', label: voiceLanguage === 'en-US' ? 'Search' : '検索' };
    }
    return null;
  }, [voiceLanguage]);

  const cleanupVoiceRecognition = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    setActiveAudioStream(null);
    setIsListening(false);
  }, []);

  const handleToggleVoice = useCallback(
    async (overrideLang?: 'ja-JP' | 'en-US' | React.SyntheticEvent) => {
      const targetLang = typeof overrideLang === 'string' ? overrideLang : voiceLanguage;

      if (isListening && typeof overrideLang !== 'string') {
        cleanupVoiceRecognition();
        return;
      }

      const SpeechRecognition =
        typeof window !== 'undefined'
          ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          : null;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      // 1. Acquire MediaStream with noise suppression for visualizer
      try {
        if (navigator?.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              noiseSuppression: true,
              echoCancellation: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
          audioStreamRef.current = stream;
          setActiveAudioStream(stream);
        }
      } catch (err) {
        console.warn('Microphone noiseSuppression setup note:', err);
      }

      // 2. Initialize SpeechRecognition instance
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = targetLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const resetSilenceTimer = () => {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          silenceTimerRef.current = setTimeout(() => {
            cleanupVoiceRecognition();
          }, silenceTimeoutMs);
        };

        recognition.onstart = () => {
          setIsListening(true);
          maxDurationTimerRef.current = setTimeout(() => {
            cleanupVoiceRecognition();
          }, maxDurationMs);

          silenceTimerRef.current = setTimeout(() => {
            cleanupVoiceRecognition();
          }, 6500);
        };

        recognition.onresult = (event: any) => {
          resetSilenceTimer();
          let interim = '';
          let final = '';

          const resultStart = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
          for (let i = resultStart; i < event.results.length; i++) {
            const res = event.results[i];
            const text = res[0]?.transcript || '';
            if (!text.trim()) continue;

            if (res.isFinal) {
              final += text;
            } else {
              interim += text;
            }
          }

          const currentFullText = final || interim;
          if (currentFullText) {
            setTranscript(currentFullText);
            onTranscriptChange?.(interim, final);
            if (final.trim()) {
              const command = parseCommand(final);
              if (command) {
                triggerCommandSuccess(command);
                onCommand?.(command, final.trim());
              }
            }
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
          }
          console.warn('SpeechRecognition error:', event.error);
          cleanupVoiceRecognition();
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.error('Failed to start SpeechRecognition:', e);
        cleanupVoiceRecognition();
      }
    },
    [
      isListening,
      voiceLanguage,
      silenceTimeoutMs,
      maxDurationMs,
      onCommand,
      onTranscriptChange,
      parseCommand,
      cleanupVoiceRecognition,
      triggerCommandSuccess,
    ]
  );

  const handleSwitchVoiceLanguage = useCallback(
    (newLang: 'ja-JP' | 'en-US') => {
      setVoiceLanguage(newLang);
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.lang = newLang;
        } catch {
          cleanupVoiceRecognition();
          setTimeout(() => {
            handleToggleVoice(newLang);
          }, 120);
        }
      }
    },
    [isListening, cleanupVoiceRecognition, handleToggleVoice]
  );

  useEffect(() => {
    return () => {
      cleanupVoiceRecognition();
    };
  }, [cleanupVoiceRecognition]);

  return {
    isListening,
    voiceLanguage,
    setLanguage: setVoiceLanguage,
    activeAudioStream,
    commandScreenFlash,
    triggeredCommand,
    setTriggeredCommand,
    transcript,
    setTranscript,
    isSupported,
    handleToggleVoice,
    handleSwitchVoiceLanguage,
    cleanupVoiceRecognition,
    triggerCommandSuccess,
  };
}
