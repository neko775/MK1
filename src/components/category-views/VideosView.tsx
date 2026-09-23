import React, { useState, useMemo } from 'react';
import {
  Play,
  Tv,
  Film,
  Video as VideoIcon,
  ExternalLink,
  BookmarkPlus,
  Check,
  Clock,
  Eye,
  Calendar,
  X,
  Sparkles,
  Maximize2,
  Share2,
} from 'lucide-react';

interface VideosViewProps {
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
  onOpenInAppBrowser?: (url: string, title: string) => void;
  onSearchQuery: (newQuery: string) => void;
}

export interface VideoItem {
  id: string;
  title: string;
  channelName: string;
  platform: 'abema' | 'youtube' | 'tver' | 'niconico';
  platformBadgeColor: string;
  duration: string;
  viewsText: string;
  publishedAt: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl?: string;
  description: string;
  isLive?: boolean;
}

export const VideosView: React.FC<VideosViewProps> = ({
  query,
  onStashPage,
  onOpenInAppBrowser,
  onSearchQuery,
}) => {
  const cleanQ = query.trim() || 'ゲーム';
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [stashedId, setStashedId] = useState<string | null>(null);
  const [activePlatformFilter, setActivePlatformFilter] = useState<'all' | 'abema' | 'youtube' | 'tver'>('all');

  const rawVideos: VideoItem[] = useMemo(() => {
    const encoded = encodeURIComponent(cleanQ);

    return [
      {
        id: 'vid-abema-1',
        title: `【ABEMA独占生放送】「${cleanQ}」24時間公式特番・最新情報発表SP (高画質無料配信)`,
        channelName: 'ABEMA SPECIAL チャンネル',
        platform: 'abema',
        platformBadgeColor: 'bg-emerald-600',
        duration: 'LIVE',
        viewsText: '18.4万人 視聴中',
        publishedAt: '生放送中',
        thumbnailUrl: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=800&auto=format&fit=crop&q=80',
        videoUrl: 'https://abema.tv/',
        embedUrl: 'https://abema.tv/',
        description: `ABEMAで24時間無料放送中！「${cleanQ}」に関する最新トレンド、公式発表、専門家による生解説をソフト内プレイヤーでお届け。`,
        isLive: true,
      },
      {
        id: 'vid-youtube-1',
        title: `【完全攻略/徹底解説】「${cleanQ}」の始め方からプロの最新テクニックまで完全網羅`,
        channelName: 'Tech & Gaming Channel JP',
        platform: 'youtube',
        platformBadgeColor: 'bg-red-600',
        duration: '24:35',
        viewsText: '42万回再生',
        publishedAt: '2日前',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}`,
        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        description: `初心者から上級者まで必見の「${cleanQ}」決定版ガイド。知っておくべき仕様や効率的な設定方法を実演付きで解説。`,
      },
      {
        id: 'vid-tver-1',
        title: `民放公式「${cleanQ}」特集ドキュメンタリー＆トレンド最前線 (見逃し配信)`,
        channelName: 'TVer (民放公式テレビ配信)',
        platform: 'tver',
        platformBadgeColor: 'bg-blue-600',
        duration: '45:10',
        viewsText: '8.9万回再生',
        publishedAt: '昨日',
        thumbnailUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
        videoUrl: 'https://tver.jp/',
        embedUrl: 'https://tver.jp/',
        description: `全国放送された「${cleanQ}」に関する特集番組の見逃しフル配信。ソフト内でログイン不要・高画質視聴対応。`,
      },
      {
        id: 'vid-youtube-2',
        title: `「${cleanQ}」公式プロモーション映像 & 最新アップデート告知トレーラー (4K UHD)`,
        channelName: 'Official Global Portal',
        platform: 'youtube',
        platformBadgeColor: 'bg-red-600',
        duration: '03:45',
        viewsText: '128万回再生',
        publishedAt: '1週間前',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}`,
        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        description: `公式が公開した「${cleanQ}」の最新シネマティック映像。圧巻のビジュアルと新機能のデモンストレーション。`,
      },
      {
        id: 'vid-abema-2',
        title: `【アニメ/ドラマ一挙放送】「${cleanQ}」関連シリーズ 全話無料配信スペシャル`,
        channelName: 'ABEMA アニメチャンネル',
        platform: 'abema',
        platformBadgeColor: 'bg-emerald-600',
        duration: '01:30:00',
        viewsText: '35.2万人',
        publishedAt: '3日前',
        thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
        videoUrl: 'https://abema.tv/',
        embedUrl: 'https://abema.tv/',
        description: `話題沸騰の関連シリーズを一挙放送！会員登録なしでいつでも見逃し視聴可能。`,
      },
      {
        id: 'vid-youtube-3',
        title: `【プロ比較】「${cleanQ}」を使うべき人・向いていない人を忖度なしで本音レビュー`,
        channelName: 'Insight Lab Japan',
        platform: 'youtube',
        platformBadgeColor: 'bg-red-600',
        duration: '18:20',
        viewsText: '19万回再生',
        publishedAt: '4日前',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}`,
        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        description: `実際の使用感、メリット・デメリット、競合との違いを徹底的に比較検証した詳細レビュー動画。`,
      },
    ];
  }, [cleanQ]);

  const displayedVideos = useMemo(() => {
    if (activePlatformFilter === 'all') return rawVideos;
    return rawVideos.filter((v) => v.platform === activePlatformFilter);
  }, [rawVideos, activePlatformFilter]);

  const handleStash = (vid: VideoItem) => {
    onStashPage(
      vid.title,
      vid.videoUrl,
      `動画 (${vid.platform.toUpperCase()}) 再生時間: ${vid.duration} チャンネル: ${vid.channelName}`,
      '動画'
    );
    setStashedId(vid.id);
    setTimeout(() => setStashedId(null), 2000);
  };

  const handlePlayVideo = (vid: VideoItem) => {
    if (onOpenInAppBrowser) {
      onOpenInAppBrowser(vid.videoUrl, `${vid.channelName} - ${vid.title}`);
    } else {
      setSelectedVideo(vid);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Quick ABEMA / TVer In-App Notice */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
              <Tv size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  ABEMA & YouTube ソフト内蔵プレイヤー対応
                </h2>
                <span className="bg-emerald-500 text-white px-2 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
                  Chrome不要で直接再生
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                ブラウザを離れることなく、アプリ内で公式生放送や動画解説を即座にフル視聴可能
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenInAppBrowser &&
                  onOpenInAppBrowser('https://abema.tv/', 'ABEMA (アベマ) 公式ストリーミング');
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Play size={13} fill="currentColor" />
              <span>ABEMAをソフト内で開く</span>
            </button>
          </div>
        </div>

        {/* Platform Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'すべての動画' },
            { id: 'abema', label: '🟢 ABEMA (アベマ) 公式' },
            { id: 'youtube', label: '🔴 YouTube' },
            { id: 'tver', label: '🔵 TVer 見逃し配信' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePlatformFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activePlatformFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedVideos.map((vid) => (
            <div
              key={vid.id}
              className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Thumbnail with Play Overlay */}
                <div
                  onClick={() => handlePlayVideo(vid)}
                  className="relative aspect-16/9 bg-gray-900 cursor-pointer overflow-hidden group"
                >
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-red-600/90 group-hover:bg-red-600 group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-all">
                      <Play size={22} fill="currentColor" className="ml-0.5" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs ${vid.platformBadgeColor}`}
                    >
                      {vid.platform.toUpperCase()}
                    </span>
                    {vid.isLive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse shadow-xs">
                        ● LIVE
                      </span>
                    )}
                  </div>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-mono font-medium">
                    {vid.duration}
                  </span>
                </div>

                {/* Content */}
                <div className="p-3.5 space-y-2">
                  <h3
                    onClick={() => handlePlayVideo(vid)}
                    className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug cursor-pointer group-hover:text-blue-600 transition-colors"
                  >
                    {vid.title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-gray-700 truncate max-w-[160px]">
                      {vid.channelName}
                    </span>
                    <span>{vid.publishedAt}</span>
                  </div>

                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {vid.description}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayVideo(vid)}
                  className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Play size={12} fill="currentColor" />
                  <span>ソフト内で再生</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStash(vid)}
                  className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-200 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Tab Stashに保存"
                >
                  {stashedId === vid.id ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <BookmarkPlus size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* In-App Player Modal Fallback */}
        {selectedVideo && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-gray-950 rounded-3xl overflow-hidden max-w-4xl w-full border border-gray-800 flex flex-col shadow-2xl">
              <div className="p-4 bg-gray-900 flex items-center justify-between gap-4 text-white">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate">{selectedVideo.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedVideo.channelName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="aspect-16/9 w-full bg-black">
                {selectedVideo.embedUrl ? (
                  <iframe
                    src={selectedVideo.embedUrl}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm">
                    動画ストリームを読み込み中...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
