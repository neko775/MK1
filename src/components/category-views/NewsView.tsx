import React, { useState, useMemo } from 'react';
import {
  Newspaper,
  Clock,
  ExternalLink,
  BookmarkPlus,
  Check,
  Globe,
  TrendingUp,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface NewsViewProps {
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
  onOpenInAppBrowser?: (url: string, title: string) => void;
  onSearchQuery: (newQuery: string) => void;
}

export interface NewsArticleItem {
  id: string;
  title: string;
  publisher: string;
  publisherColor: string;
  publishedAt: string;
  category: 'breaking' | 'tech' | 'economy' | 'general' | 'entertainment';
  categoryLabel: string;
  summary: string;
  url: string;
  thumbnailUrl?: string;
  isBreaking?: boolean;
}

export const NewsView: React.FC<NewsViewProps> = ({
  query,
  onStashPage,
  onOpenInAppBrowser,
  onSearchQuery,
}) => {
  const cleanQ = query.trim() || 'ゲーム';
  const [stashedId, setStashedId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const articles: NewsArticleItem[] = useMemo(() => {
    const encoded = encodeURIComponent(cleanQ);

    return [
      {
        id: 'news-1',
        title: `【速報】「${cleanQ}」市場規模が過去最大を更新、世界的な需要急増で各社が新戦略を発表`,
        publisher: '日本経済新聞 (日経)',
        publisherColor: 'bg-red-800',
        publishedAt: '25分前',
        category: 'economy',
        categoryLabel: '経済・市場',
        summary: `最新の業界動向レポートによると、「${cleanQ}」関連の市場流通規模が前年比140%を記録。国内外の主要企業が連携を強化し、次世代技術との融合を進める方針を固めました。`,
        url: `https://news.google.com/search?q=${encoded}`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80',
        isBreaking: true,
      },
      {
        id: 'news-2',
        title: `「${cleanQ}」の次世代規格・AI連携ソリューションが正式公開、エンジニアの間で話題沸騰`,
        publisher: 'ITmedia NEWS',
        publisherColor: 'bg-blue-800',
        publishedAt: '1時間前',
        category: 'tech',
        categoryLabel: 'IT・テクノロジー',
        summary: `開発者カンファレンスにて「${cleanQ}」の高速処理アーキテクチャが初公開。従来の課題とされていた処理遅延を約70%削減することに成功したと発表されました。`,
        url: `https://news.google.com/search?q=${encoded}+ITmedia`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'news-3',
        title: `【国際】「${cleanQ}」に関する国際標準化ガイドラインが合意、来期より世界適用へ`,
        publisher: 'ロイター通信 (Reuters)',
        publisherColor: 'bg-orange-700',
        publishedAt: '3時間前',
        category: 'general',
        categoryLabel: '国際・総合',
        summary: `主要国参加の標準化ワーキンググループにおいて、「${cleanQ}」の運用安全基準とセキュリティ指針が正式採択されました。透明性と利便性の両立が評価されています。`,
        url: `https://news.google.com/search?q=${encoded}+Reuters`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'news-4',
        title: `注目の最新トレンド：「${cleanQ}」を日常生活やビジネスで120%活用する実践テクニック`,
        publisher: 'Yahoo!ニュース エキスパート',
        publisherColor: 'bg-rose-700',
        publishedAt: '5時間前',
        category: 'entertainment',
        categoryLabel: 'ライフスタイル',
        summary: `専門家が詳しく解説する「${cleanQ}」の失敗しない選び方と実践的活用術。初心者でもすぐに試せる具体的なステップを紹介。`,
        url: `https://news.google.com/search?q=${encoded}+Yahoo`,
        thumbnailUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80',
      },
    ];
  }, [cleanQ]);

  const filteredArticles = useMemo(() => {
    if (selectedTag === 'all') return articles;
    return articles.filter((a) => a.category === selectedTag);
  }, [articles, selectedTag]);

  const handleArticleClick = (item: NewsArticleItem) => {
    if (onOpenInAppBrowser) {
      onOpenInAppBrowser(item.url, `${item.publisher} - ${item.title}`);
    }
  };

  const handleStash = (item: NewsArticleItem) => {
    onStashPage(item.title, item.url, `[ニュース速報] ${item.summary}`, 'ニュース');
    setStashedId(item.id);
    setTimeout(() => setStashedId(null), 2000);
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-[1000px] mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center">
              <Newspaper size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  「{cleanQ}」に関する最新ニュース速報・タイムライン
                </h2>
                <span className="bg-rose-600 text-white px-2 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
                  リアルタイム更新
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                日経・ITmedia・ロイター・Yahoo!ニュースなど主要メディアの最新報道をソフト内で網羅
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'すべてのニュース' },
            { id: 'economy', label: '📊 経済・市場' },
            { id: 'tech', label: '💻 IT・テクノロジー' },
            { id: 'general', label: '🌍 国際・総合' },
            { id: 'entertainment', label: '💡 トレンド' },
          ].map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTag(tag.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                selectedTag === tag.id
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* News Article Timeline List */}
        <div className="space-y-3.5">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 justify-between"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${article.publisherColor}`}
                  >
                    {article.publisher}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {article.publishedAt}
                  </span>
                  {article.isBreaking && (
                    <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-300">
                      ⚡ 速報
                    </span>
                  )}
                </div>

                <h3
                  onClick={() => handleArticleClick(article)}
                  className="text-sm sm:text-base font-bold text-gray-900 leading-snug cursor-pointer group-hover:text-blue-600 transition-colors"
                >
                  {article.title}
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {article.summary}
                </p>

                <div className="pt-2 flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => handleArticleClick(article)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200"
                  >
                    <Globe size={13} />
                    <span>ソフト内で記事を読む</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStash(article)}
                    className="text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {stashedId === article.id ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <BookmarkPlus size={14} />
                    )}
                    <span>{stashedId === article.id ? '保存済' : '保存'}</span>
                  </button>
                </div>
              </div>

              {/* Optional Thumbnail */}
              {article.thumbnailUrl && (
                <div
                  onClick={() => handleArticleClick(article)}
                  className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0 cursor-pointer"
                >
                  <img
                    src={article.thumbnailUrl}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
