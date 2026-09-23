import React, { useState, useEffect, useRef } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  X,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Globe,
  Tv,
  Film,
  Lock,
  Sparkles,
} from 'lucide-react';

interface InAppBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl: string;
  initialTitle?: string;
  onOpenGeminiWithContext?: (url: string, title: string) => void;
}

type BrowserMode = 'webview' | 'native' | 'external';

export const InAppBrowserModal: React.FC<InAppBrowserModalProps> = ({
  isOpen,
  onClose,
  initialUrl,
  initialTitle = 'Web Viewer',
  onOpenGeminiWithContext,
}) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [loadError, setLoadError] = useState(false);
  const [loadTimeoutWarning, setLoadTimeoutWarning] = useState(false);
  const [browserMode, setBrowserMode] = useState<BrowserMode>(() => {
    try {
      const saved = localStorage.getItem('myengine_browser_mode');
      return saved === 'native' || saved === 'external' ? saved : 'webview';
    } catch {
      return 'webview';
    }
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && initialUrl) {
      setCurrentUrl(initialUrl);
      setInputUrl(initialUrl);
      setPageTitle(initialTitle || 'Web Viewer');
      setHistory([initialUrl]);
      setHistoryIndex(0);
      setLoadError(false);
      setLoadTimeoutWarning(false);
      setIsLoading(true);
      setIframeKey(Date.now());
    }
  }, [isOpen, initialUrl, initialTitle]);

  useEffect(() => {
    try {
      localStorage.setItem('myengine_browser_mode', browserMode);
    } catch {
      // Ignore storage failures in private browsing contexts.
    }
  }, [browserMode]);

  useEffect(() => {
    if (!isOpen || browserMode === 'webview' || !currentUrl || Capacitor.getPlatform() === 'web') return;

    let cancelled = false;
    let browserFinishedListener: { remove: () => Promise<void> } | undefined;
    const openNativeBrowser = async () => {
      browserFinishedListener = await Browser.addListener('browserFinished', () => {
        if (!cancelled) onClose();
      });
      if (cancelled) {
        await browserFinishedListener.remove();
        return;
      }
      await Browser.open({
        url: currentUrl,
        presentationStyle: 'fullscreen',
      });
    };

    void openNativeBrowser().catch(() => {
      if (!cancelled) setBrowserMode('webview');
    });

    return () => {
      cancelled = true;
      if (browserFinishedListener) void browserFinishedListener.remove();
      void Browser.close().catch(() => undefined);
    };
  }, [browserMode, currentUrl, isOpen, onClose]);

  // Fallback timer: Some external sites with X-Frame-Options block iframe rendering silently.
  // After 6 seconds of loading, show the handy external browser launch helper banner.
  useEffect(() => {
    if (!isOpen || !isLoading) {
      setLoadTimeoutWarning(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadTimeoutWarning(true);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isOpen, isLoading, iframeKey]);

  // Esc key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const initialFocus = dialogRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
    );
    initialFocus?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Transform YouTube / Abema / NicoNico or typical URLs to embeddable formats when possible
  const getEmbeddableUrl = (url: string) => {
    try {
      const u = new URL(url);
      // YouTube Watch URL -> Embed URL
      if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
        const videoId = u.searchParams.get('v');
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      }
      if (u.hostname.includes('youtu.be')) {
        const videoId = u.pathname.replace('/', '');
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const embedUrl = getEmbeddableUrl(currentUrl);
  const isVideoPlatform =
    currentUrl.includes('abema.tv') ||
    currentUrl.includes('youtube.com') ||
    currentUrl.includes('youtu.be') ||
    currentUrl.includes('tver.jp') ||
    currentUrl.includes('nicovideo.jp');

  const navigateTo = (newUrl: string) => {
    let formatted = newUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      if (formatted.includes('.') && !formatted.includes(' ')) {
        formatted = 'https://' + formatted;
      } else {
        formatted = `https://ja.wikipedia.org/wiki/${encodeURIComponent(formatted)}`;
      }
    }
    const newHist = history.slice(0, historyIndex + 1);
    newHist.push(formatted);
    setHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setCurrentUrl(formatted);
    setInputUrl(formatted);
    setIsLoading(true);
    setLoadError(false);
    setIframeKey(Date.now());
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(prev);
      setInputUrl(prev);
      setIsLoading(true);
      setLoadError(false);
      setIframeKey(Date.now());
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(next);
      setInputUrl(next);
      setIsLoading(true);
      setLoadError(false);
      setIframeKey(Date.now());
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setLoadError(false);
    setIframeKey(Date.now());
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBrowserModeChange = (mode: BrowserMode) => {
    setBrowserMode(mode);
    if (mode === 'external') {
      handleOpenExternal();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${pageTitle} - Web Viewer`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        className={`bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[88vh]'
        }`}
      >
        {/* Browser Top Navigation Bar */}
        <div className="bg-[#F8F9FA] border-b border-gray-200 px-3 py-2 flex items-center gap-2 select-none shrink-0">
          {/* Back, Forward, Reload */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className={`p-1.5 rounded-lg text-gray-600 transition-colors ${
                historyIndex <= 0
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200 active:bg-gray-300 cursor-pointer'
              }`}
              title="戻る"
              aria-label="戻る"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleForward}
              disabled={historyIndex >= history.length - 1}
              className={`p-1.5 rounded-lg text-gray-600 transition-colors ${
                historyIndex >= history.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:bg-gray-200 active:bg-gray-300 cursor-pointer'
              }`}
              title="進む"
              aria-label="進む"
            >
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleReload}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors cursor-pointer"
              title="再読み込み"
              aria-label="再読み込み"
            >
              <RotateCw size={15} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>

          {/* Omnibox / URL Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigateTo(inputUrl);
            }}
            className="flex-1 flex items-center bg-white border border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 py-1.5 shadow-2xs transition-all"
          >
            {isVideoPlatform ? (
              <Tv size={14} className="text-rose-500 mr-2 shrink-0" />
            ) : (
              <Lock size={13} className="text-emerald-600 mr-2 shrink-0" />
            )}
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="URLを入力 または 検索..."
              className="flex-1 text-xs text-gray-800 bg-transparent outline-hidden font-mono"
            />
            {currentUrl && (
              <span className="text-[10px] text-gray-400 font-sans hidden sm:inline ml-2 truncate max-w-[120px]">
                {pageTitle}
              </span>
            )}
          </form>

          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
            <span className="sr-only">閲覧方式</span>
            <select
              value={browserMode}
              onChange={(event) => handleBrowserModeChange(event.target.value as BrowserMode)}
              className="max-w-[150px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[10px] text-gray-700 outline-hidden focus:border-blue-500"
              title="閲覧方式を選択"
            >
              <option value="webview">アプリ内WebView</option>
              <option value="native">Safari / Custom Tabs</option>
              <option value="external">外部ブラウザ</option>
            </select>
          </label>

          {/* Action Tools */}
          <div className="flex items-center gap-1">
            {/* AI Summarize / Assistant */}
            {onOpenGeminiWithContext && (
              <button
                type="button"
                onClick={() => {
                  onOpenGeminiWithContext(currentUrl, pageTitle);
                }}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-medium hover:opacity-95 cursor-pointer shadow-2xs"
                title="このページをAIで要約・質問"
              >
                <Sparkles size={13} />
                <span>AI 要約</span>
              </button>
            )}

            {/* Copy URL */}
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              title="URLをコピー"
              aria-label="URLをコピー"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>

            {/* Open in External Browser */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              title="外部ブラウザで開く"
              aria-label="外部ブラウザで開く"
            >
              <ExternalLink size={16} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? '元に戻す' : '全画面'}
              aria-label="全画面切り替え"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-600 hover:bg-rose-100 hover:text-rose-700 transition-colors cursor-pointer ml-1"
              title="閉じる"
              aria-label="閉じる"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Browser Content Area (WebView iframe + native browser fallback) */}
        <div className="flex-1 relative bg-gray-100 overflow-hidden flex flex-col">
          {browserMode === 'external' || (browserMode === 'native' && Capacitor.getPlatform() !== 'web') ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
              <Globe size={32} className="text-blue-600" />
              <p className="text-sm font-semibold text-gray-800">{browserMode === 'native' ? 'システムブラウザで表示中' : '外部ブラウザで表示中'}</p>
              <p className="max-w-sm text-xs leading-relaxed text-gray-500">iOSではSFSafariViewController、AndroidではCustom Tabsを使用しています。</p>
              <button type="button" onClick={() => setBrowserMode('webview')} className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm ring-1 ring-gray-200">アプリ内WebViewに戻る</button>
            </div>
          ) : (
            <>
          {/* Loading bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
              <div className="h-full bg-blue-600 animate-pulse w-2/3" />
            </div>
          )}

          {/* Embedded Web View */}
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={pageTitle}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-autoplay"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => {
              setIsLoading(false);
              setLoadError(false);
              setLoadTimeoutWarning(false);
            }}
            onError={() => {
              setIsLoading(false);
              setLoadError(true);
            }}
          />

          {/* X-Frame-Options / Embedding Blocked Prominent Fallback Notice */}
          {(loadError || loadTimeoutWarning) && (
            <div className="absolute inset-0 bg-gray-900/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 ring-1 ring-white/20">
                <Globe size={28} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-bold mb-1">
                {loadError ? 'ページの埋め込み表示が制限されています' : 'セキュリティ保護されたWebサイトです'}
              </h3>
              <p className="text-xs text-gray-300 max-w-md mb-5 leading-relaxed">
                このサイト（{(() => {
                  try {
                    return new URL(currentUrl).hostname;
                  } catch {
                    return currentUrl;
                  }
                })()}）はセキュリティ方針（X-Frame-Options または CORS）によりアプリ内埋め込みが制限されています。外部ブラウザで安全に閲覧いただけます。
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-lg hover:from-blue-500 hover:to-indigo-500 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink size={15} />
                  <span>外部ブラウザで直接開く</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'URLをコピーしました' : 'URLをコピー'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Abema / Video Direct Banner helper when viewing streaming media */}
          {isVideoPlatform && !loadError && !loadTimeoutWarning && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-xl flex items-center gap-3 text-xs z-30">
              <Film size={14} className="text-amber-400" />
              <span>ソフト内動画ストリーミング再生中（{pageTitle}）</span>
              <button
                type="button"
                onClick={handleOpenExternal}
                className="underline hover:text-blue-300 ml-2 cursor-pointer flex items-center gap-1"
              >
                <span>別窓で視聴</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
