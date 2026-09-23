import React, { useState, useMemo } from 'react';
import {
  Play,
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  Check,
  Flame,
  Music,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ShortsViewProps {
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
  onOpenInAppBrowser?: (url: string, title: string) => void;
  onSearchQuery: (newQuery: string) => void;
}

export interface ShortVideoItem {
  id: string;
  title: string;
  creatorName: string;
  creatorHandle: string;
  viewsText: string;
  likesText: string;
  commentsCount: string;
  musicTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  tags: string[];
}

export const ShortsView: React.FC<ShortsViewProps> = ({
  query,
  onStashPage,
  onOpenInAppBrowser,
  onSearchQuery,
}) => {
  const cleanQ = query.trim() || 'ゲーム';
  const [stashedId, setStashedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  const shorts: ShortVideoItem[] = useMemo(() => {
    const encoded = encodeURIComponent(cleanQ);

    return [
      {
        id: 'short-1',
        title: `知らなきゃ損する「${cleanQ}」の超絶テクニック 3選！🔥 #Shorts`,
        creatorName: 'ショートマスターJP',
        creatorHandle: '@short_master_jp',
        viewsText: '184万回再生',
        likesText: '9.4万',
        commentsCount: '1,280',
        musicTitle: 'オリジナル音源 - トレンドサウンド',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}+%23shorts`,
        tags: [`#${cleanQ}`, '#裏技', '#おすすめ'],
      },
      {
        id: 'short-2',
        title: `【神回】「${cleanQ}」でまさかの奇跡が起きた瞬間www ⚡`,
        creatorName: 'ゲームクリップ速報',
        creatorHandle: '@clip_express',
        viewsText: '290万回再生',
        likesText: '14.2万',
        commentsCount: '2,450',
        musicTitle: 'ハイテンションBGM 2026',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}+%23shorts`,
        tags: [`#${cleanQ}`, '#神プレイ', '#爆笑'],
      },
      {
        id: 'short-3',
        title: `10秒でわかる「${cleanQ}」の最新アップデートまとめ！`,
        creatorName: 'クイックニュースCh',
        creatorHandle: '@quick_news_jp',
        viewsText: '88万回再生',
        likesText: '4.7万',
        commentsCount: '890',
        musicTitle: 'アップビートエレクトロ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}+%23shorts`,
        tags: [`#${cleanQ}`, '#速報', '#まとめ'],
      },
      {
        id: 'short-4',
        title: `【プロの技】「${cleanQ}」を最速でマスターする秘訣とは？`,
        creatorName: 'PRO GAMING LAB',
        creatorHandle: '@pro_gaming_lab',
        viewsText: '142万回再生',
        likesText: '8.1万',
        commentsCount: '1,120',
        musicTitle: 'Cyber Trap Beat',
        thumbnailUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=80',
        videoUrl: `https://www.youtube.com/results?search_query=${encoded}+%23shorts`,
        tags: [`#${cleanQ}`, '#プロ直伝', '#解説'],
      },
    ];
  }, [cleanQ]);

  const handlePlayShort = (item: ShortVideoItem) => {
    if (onOpenInAppBrowser) {
      onOpenInAppBrowser(item.videoUrl, `${item.creatorName} - ${item.title}`);
    }
  };

  const handleStash = (item: ShortVideoItem) => {
    onStashPage(
      item.title,
      item.videoUrl,
      `ショート動画 (${item.creatorName}) 再生数: ${item.viewsText}`,
      'ショート動画'
    );
    setStashedId(item.id);
    setTimeout(() => setStashedId(null), 2000);
  };

  const toggleLike = (id: string) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 text-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-400/30 flex items-center justify-center">
              <Flame size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  「{cleanQ}」の縦型ショート動画・リール
                </h2>
                <span className="bg-red-500 text-white px-2 py-0.2 rounded-full text-[10px] font-bold">
                  YouTube Shorts / TikTok
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                サクサク見られる 9:16 縦型動画クリップ・ハイライトをソフト内で再生
              </p>
            </div>
          </div>
        </div>

        {/* 9:16 Vertical Shorts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {shorts.map((item) => {
            const isLiked = !!likedIds[item.id];

            return (
              <div
                key={item.id}
                className="group relative bg-gray-950 rounded-3xl overflow-hidden border border-gray-800 hover:border-red-500 shadow-lg transition-all flex flex-col aspect-9/16"
              >
                {/* Thumbnail Background */}
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-xs">
                    SHORTS
                  </span>
                </div>

                {/* Right Floating Actions (TikTok style) */}
                <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3 z-10">
                  <button
                    type="button"
                    onClick={() => toggleLike(item.id)}
                    className="flex flex-col items-center gap-0.5 group/btn cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
                        isLiked ? 'bg-red-500 text-white scale-110' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                    >
                      <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                    </div>
                    <span className="text-[10px] text-white font-bold drop-shadow">
                      {item.likesText}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStash(item)}
                    className="flex flex-col items-center gap-0.5 cursor-pointer"
                    title="Tab Stashに保存"
                  >
                    <div className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md shadow-md transition-all">
                      {stashedId === item.id ? (
                        <Check size={18} className="text-emerald-400" />
                      ) : (
                        <BookmarkPlus size={18} />
                      )}
                    </div>
                    <span className="text-[10px] text-white font-bold drop-shadow">保存</span>
                  </button>
                </div>

                {/* Center Big Play Button (Hover) */}
                <div
                  onClick={() => handlePlayShort(item)}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 group-hover:bg-red-600/90 text-white flex items-center justify-center backdrop-blur-md opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-xl">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>

                {/* Bottom Content Metadata */}
                <div className="absolute bottom-3 left-3 right-12 z-10 text-white space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="truncate">{item.creatorHandle}</span>
                  </div>

                  <h3
                    onClick={() => handlePlayShort(item)}
                    className="text-xs font-medium text-white line-clamp-2 leading-tight cursor-pointer hover:underline"
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-1 text-[10px] text-gray-300 truncate">
                    <Music size={11} className="shrink-0" />
                    <span className="truncate">{item.musicTitle}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-gray-400 pt-0.5">
                    <span>{item.viewsText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
