import React, { useState } from 'react';
import { Compass, ExternalLink, X, Search, BookmarkPlus, Sparkles, Languages, Globe2 } from 'lucide-react';
import { EngineResult } from '../types';
import { apiUrl, generateGeminiFallback, getStoredGeminiApiKey } from '../lib/api';

interface CrossEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
}

export const CrossEngineModal: React.FC<CrossEngineModalProps> = ({
  isOpen,
  onClose,
  query,
  onStashPage,
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [internalQuery, setInternalQuery] = useState(query || 'React 19 Server Components benchmark');
  const [editedResults, setEditedResults] = useState<Record<string, { title: string; snippet: string }>>({});
  const [aiSummary, setAiSummary] = useState('');
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);

  if (!isOpen) return null;

  const currentQ = internalQuery || '検索クエリ';

  const encodedQuery = encodeURIComponent(currentQ);
  const mockEngines: EngineResult[] = [
    {
      engine: 'Google',
      icon: '🌐',
      results: [
        {
          title: `Google で「${currentQ}」のWeb検索結果を表示`,
          url: `https://www.google.com/search?q=${encodeURIComponent(currentQ)}`,
          snippet: `Google のグローバルインデックスから「${currentQ}」に関する最新情報、公式Webサイト、技術ドキュメントを検索。`,
          extra: 'Google 公式検索 / 全Webインデックス',
        },
        {
          title: `Google ニュース: 「${currentQ}」の最新報道・ニュース速報`,
          url: `https://news.google.com/search?q=${encodeURIComponent(currentQ)}&hl=ja&gl=JP`,
          snippet: `各報道機関・メディアによる「${currentQ}」のリアルタイム速報、時事解説記事を一覧表示。`,
        },
      ],
    },
    {
      engine: 'DuckDuckGo',
      icon: '🦆',
      results: [
        {
          title: `DuckDuckGo で「${currentQ}」を非追跡・プライベート検索`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(currentQ)}`,
          snippet: `トラッカーやパーソナライズ広告を完全排除した非偏向検索結果。プライバシー重視のクリーンな情報収集。`,
          extra: 'No Tracker / 完全プライベート',
        },
        {
          title: `DuckDuckGo Web Instant: 「${currentQ}」`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(currentQ)}&ia=web`,
          snippet: `インスタントアンサー機能による用語定義や技術ドキュメントの即時サマリー。`,
        },
      ],
    },
    {
      engine: 'Bing',
      icon: '🟦',
      results: [{ title: `Bingで「${currentQ}」を検索`, url: `https://www.bing.com/search?q=${encodedQuery}`, snippet: 'Bingの公開Web検索ページ。' }],
    },
    {
      engine: 'Yahoo! JAPAN',
      icon: '🔴',
      results: [{ title: `Yahoo! JAPANで「${currentQ}」を検索`, url: `https://search.yahoo.co.jp/search?p=${encodedQuery}`, snippet: 'Yahoo! JAPANの公開Web検索ページ。' }],
    },
    {
      engine: 'GitHub',
      icon: '🐙',
      results: [
        {
          title: `GitHub で「${currentQ}」のオープンソースリポジトリを検索`,
          url: `https://github.com/search?q=${encodeURIComponent(currentQ)}`,
          snippet: `TypeScript / Python / Go / Rust などによる「${currentQ}」の実装コードやスター数上位のライブラリ。`,
          extra: 'GitHub 全リポジトリ検索',
        },
        {
          title: `GitHub トピックス: ${currentQ} 関連プロジェクト一覧`,
          url: `https://github.com/search?q=${encodeURIComponent(currentQ)}&type=repositories`,
          snippet: `コミュニティによりタグ付けされたスター急上昇中の関連OSSプロジェクト。`,
        },
      ],
    },
    {
      engine: 'arXiv',
      icon: '📄',
      results: [
        {
          title: `arXiv で「${currentQ}」に関する査読前・学術論文を全文検索`,
          url: `https://arxiv.org/search/?query=${encodeURIComponent(currentQ)}&searchtype=all`,
          snippet: `コーネル大学が運営する学術論文アーカイブ。AI、計算機科学、数学、物理分野における最先端の研究プレプリント。`,
          extra: 'arXiv 公式アーカイブ検索',
        },
        {
          title: `arXiv Computer Science: 「${currentQ}」関連論文`,
          url: `https://arxiv.org/search/cs?query=${encodeURIComponent(currentQ)}&searchtype=all`,
          snippet: `コンピュータサイエンス（cs.AI / cs.DC / cs.SE）カテゴリに限定した高精度学術論文検索。`,
        },
      ],
    },
    {
      engine: 'X',
      icon: '𝕏',
      results: [
        {
          title: `X (旧Twitter) で「${currentQ}」のトップポストを検索`,
          url: `https://x.com/search?q=${encodeURIComponent(currentQ)}`,
          snippet: `いま現在「${currentQ}」に関して最もリポスト・いいねされている話題のポスト、エンジニアの感想、公式発表。`,
          extra: 'リアルタイムトレンド / 話題のポスト',
        },
        {
          title: `X リアルタイム速報: 「${currentQ}」の最新ポスト一覧`,
          url: `https://x.com/search?q=${encodeURIComponent(currentQ)}&f=live`,
          snippet: `秒単位でリアルタイム投稿される最新ポストのタイムラインを直接閲覧。`,
        },
      ],
    },
    {
      engine: 'YouTube',
      icon: '▶️',
      results: [{ title: `YouTubeで「${currentQ}」を検索`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(currentQ)}`, snippet: '公式チャンネル、解説、ライブ配信を検索。' }],
    },
    {
      engine: 'TikTok',
      icon: '🎵',
      results: [{ title: `TikTokで「${currentQ}」を検索`, url: `https://www.tiktok.com/search?q=${encodeURIComponent(currentQ)}`, snippet: '公開ショート動画と話題の投稿を検索。' }],
    },
    {
      engine: 'Instagram',
      icon: '📷',
      results: [{ title: `Instagramで「${currentQ}」を検索`, url: `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(currentQ)}`, snippet: '公開プロフィール、ハッシュタグ、投稿を検索。' }],
    },
    {
      engine: 'Facebook',
      icon: 'ⓕ',
      results: [{ title: `Facebookで「${currentQ}」を検索`, url: `https://www.facebook.com/search/top?q=${encodeURIComponent(currentQ)}`, snippet: '公開ページ、投稿、グループを検索。' }],
    },
    {
      engine: 'Reddit',
      icon: '🔴',
      results: [{ title: `Redditで「${currentQ}」を検索`, url: `https://www.reddit.com/search/?q=${encodeURIComponent(currentQ)}`, snippet: '公開コミュニティの投稿と議論を検索。' }],
    },
    {
      engine: 'Threads',
      icon: '◉',
      results: [{ title: `Threadsで「${currentQ}」を検索`, url: `https://www.threads.net/search?q=${encodeURIComponent(currentQ)}`, snippet: '公開投稿と会話を検索。' }],
    },
    {
      engine: 'LinkedIn',
      icon: 'in',
      results: [{ title: `LinkedInで「${currentQ}」を検索`, url: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(currentQ)}`, snippet: '公開プロフィール、企業、求人、投稿を検索。' }],
    },
    {
      engine: 'Pinterest',
      icon: 'Ⓟ',
      results: [{ title: `Pinterestで「${currentQ}」を検索`, url: `https://www.pinterest.com/search/pins/?q=${encodedQuery}`, snippet: '公開ピンとボードを検索。' }],
    },
    {
      engine: 'Bluesky',
      icon: '🦋',
      results: [{ title: `Blueskyで「${currentQ}」を検索`, url: `https://bsky.app/search?q=${encodedQuery}`, snippet: '公開投稿とアカウントを検索。' }],
    },
  ];

  const displayedEngines =
    activeTab === 'all'
      ? mockEngines
      : mockEngines.filter((e) => e.engine === activeTab);

  const updateResult = (engine: string, index: number, field: 'title' | 'snippet', value: string) => {
    const key = `${engine}-${index}`;
    const original = mockEngines.find((item) => item.engine === engine)?.results[index];
    if (!original) return;
    setEditedResults((previous) => ({
      ...previous,
      [key]: { ...(previous[key] || { title: original.title, snippet: original.snippet }), [field]: value },
    }));
  };

  const handleAiOrganize = async () => {
    setIsAiWorking(true);
    const rows = mockEngines.flatMap((engine) => engine.results.map((result, index) => {
      const edited = editedResults[`${engine.engine}-${index}`];
      return `${engine.engine}: ${edited?.title || result.title}\n${edited?.snippet || result.snippet}`;
    })).join('\n\n');
    try {
      const response = await fetch(apiUrl('/api/gemini/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `次の横断検索結果を重複なく重要度順の短い箇条書きに整理してください。未確認の事実は追加しないでください。\n\n${rows}` }),
      });
      const data = await response.json();
      setAiSummary(data.reply || 'AI整理結果を取得できませんでした。');
    } catch {
      const apiKey = getStoredGeminiApiKey();
      if (apiKey) {
        try {
          const fallback = await generateGeminiFallback(
            `次の横断検索結果を重複なく重要度順の短い箇条書きに整理してください。未確認の事実は追加しないでください。\n\n${rows}`,
            [],
            apiKey,
          );
          setAiSummary(fallback);
          return;
        } catch {
          // Show the connection guidance below when direct Gemini is unavailable.
        }
      }
      setAiSummary('AI整理にはGemini APIキーまたは公開APIサーバーの設定が必要です。');
    } finally {
      setIsAiWorking(false);
    }
  };

  const handleAiImproveQuery = async () => {
    setIsAiWorking(true);
    try {
      const response = await fetch(apiUrl('/api/gemini/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `「${currentQ}」をWeb検索とSNS検索で使いやすい短い検索語に改善し、候補を5個だけJSON配列で返してください。説明文や未確認情報は不要です。`,
        }),
      });
      const data = await response.json();
      const match = String(data.reply || '').match(/\[[\s\S]*\]/);
      if (match) {
        const parsed: unknown = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          setQuerySuggestions(parsed.filter((item): item is string => typeof item === 'string').slice(0, 5));
        }
      }
    } catch {
      setQuerySuggestions([]);
    } finally {
      setIsAiWorking(false);
    }
  };

  const openAllSearches = () => {
    mockEngines.forEach((engine, index) => {
      engine.results.forEach((result, resultIndex) => {
        window.setTimeout(() => window.open(result.url, '_blank', 'noopener,noreferrer'), (index * 2 + resultIndex) * 80);
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                複数エンジン・SNS横断検索
              </h2>
              <p className="text-xs text-gray-500">
                Web、開発、動画、SNSの公開検索を同じクエリで一覧比較・編集
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Query Input Bar */}
        <div className="p-3 px-6 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <Search size={15} className="text-gray-400" />
            <input
              type="text"
              value={internalQuery}
              onChange={(e) => setInternalQuery(e.target.value)}
              placeholder="横断比較するクエリを入力..."
              className="w-full text-xs text-gray-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAiImproveQuery}
              disabled={isAiWorking}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              title="AIで検索語を改善"
            >
              <Languages size={13} />
              AI最適化
            </button>
            <button
              type="button"
              onClick={openAllSearches}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              title="すべての検索サービスを開く"
            >
              <Globe2 size={13} />
              全て開く
            </button>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
            {(['all', ...mockEngines.map((engine) => engine.engine)]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab === 'all' ? '全体一覧' : tab}
              </button>
            ))}
          </div>
        </div>

        {querySuggestions.length > 0 && (
          <div className="px-6 py-2 border-b border-gray-200 bg-indigo-50/70 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-indigo-900">AI候補:</span>
            {querySuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInternalQuery(suggestion)}
                className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[11px] text-indigo-700 hover:bg-indigo-100"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Multi-column Grid Area */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1 bg-gray-50/40">
          <div
            className={`grid gap-4 min-w-[720px] ${
              activeTab === 'all'
                ? 'grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 max-w-2xl mx-auto'
            }`}
          >
            {displayedEngines.map((col) => (
              <div
                key={col.engine}
                className="bg-white rounded-xl border border-gray-200/80 shadow-2xs flex flex-col overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{col.icon}</span>
                    <span className="text-xs font-bold text-gray-800">{col.engine}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                    {col.results.length} 件
                  </span>
                </div>

                {/* Results inside Column */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                  {col.results.map((res, rIdx) => {
                    const edited = editedResults[`${col.engine}-${rIdx}`];
                    const title = edited?.title || res.title;
                    const snippet = edited?.snippet || res.snippet;
                    return (
                    <div
                      key={rIdx}
                      className="group p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
                    >
                      <input
                        value={title}
                        onChange={(event) => updateResult(col.engine, rIdx, 'title', event.target.value)}
                        className="w-full text-xs font-semibold text-blue-700 bg-transparent border-b border-transparent focus:border-blue-300 focus:outline-none mb-1"
                        aria-label={`${col.engine}のタイトル`}
                      />
                      <textarea
                        value={snippet}
                        onChange={(event) => updateResult(col.engine, rIdx, 'snippet', event.target.value)}
                        className="w-full min-h-16 text-[11px] text-gray-600 bg-transparent border border-transparent focus:border-gray-200 focus:bg-white rounded p-1 resize-y leading-relaxed mb-2"
                        aria-label={`${col.engine}の説明`}
                      />
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-700 hover:underline line-clamp-2 block mb-1"
                      >
                        リンクを開く
                      </a>
                      <p className="text-[11px] text-gray-600 line-clamp-3 leading-relaxed mb-2">
                        {snippet}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px]">
                        <span className="text-gray-400 font-mono truncate max-w-[110px]">
                          {res.extra || col.engine}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onStashPage(title, res.url, snippet, col.engine)}
                            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Tab Stashに一時保存"
                          >
                            <BookmarkPlus size={12} />
                          </button>
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-800"
                            title="別タブで開く"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                <Sparkles size={14} />
                AIで検索結果を整理
              </div>
              <button
                type="button"
                onClick={handleAiOrganize}
                disabled={isAiWorking}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                <Sparkles size={13} />
                {isAiWorking ? '整理中...' : 'AI整理'}
              </button>
            </div>
            {aiSummary && <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-blue-950">{aiSummary}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{mockEngines.length}サービスの公開検索リンクを一覧表示</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-xs hover:bg-black transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
