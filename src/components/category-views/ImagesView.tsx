import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  ExternalLink,
  BookmarkPlus,
  Copy,
  Check,
  Download,
  Maximize2,
  X,
  Search,
  Sparkles,
  Share2,
  Filter,
  Eye,
} from 'lucide-react';

interface ImagesViewProps {
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
  onOpenInAppBrowser?: (url: string, title: string) => void;
  onSearchQuery: (newQuery: string) => void;
}

export interface ImageResultItem {
  id: string;
  title: string;
  sourceName: string;
  pageUrl: string;
  imageUrl: string;
  resolution: string;
  aspectRatio: 'square' | 'wide' | 'tall';
  tag: string;
}

export const ImagesView: React.FC<ImagesViewProps> = ({
  query,
  onStashPage,
  onOpenInAppBrowser,
  onSearchQuery,
}) => {
  const cleanQ = query.trim() || 'ゲーム';
  const [selectedImage, setSelectedImage] = useState<ImageResultItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stashedId, setStashedId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all'>('all');

  // Do not invent thumbnails: image search is delegated to real image indexes.
  const imageResults: ImageResultItem[] = useMemo(() => {
    const encoded = encodeURIComponent(cleanQ);
    return [
      { id: 'image-google', title: `Google画像検索: ${cleanQ}`, sourceName: 'Google Images', pageUrl: `https://www.google.com/search?tbm=isch&q=${encoded}`, imageUrl: '', resolution: '実検索結果', aspectRatio: 'wide' as const, tag: 'search' },
      { id: 'image-bing', title: `Bing画像検索: ${cleanQ}`, sourceName: 'Bing Images', pageUrl: `https://www.bing.com/images/search?q=${encoded}`, imageUrl: '', resolution: '実検索結果', aspectRatio: 'wide' as const, tag: 'search' },
      { id: 'image-duck', title: `DuckDuckGo画像検索: ${cleanQ}`, sourceName: 'DuckDuckGo Images', pageUrl: `https://duckduckgo.com/?q=${encoded}&iax=images&ia=images`, imageUrl: '', resolution: '実検索結果', aspectRatio: 'wide' as const, tag: 'search' },
    ];
  }, [cleanQ]);

  const filteredImages = useMemo(() => {
    return imageResults;
  }, [imageResults, selectedFilter]);

  const handleCopyLink = (item: ImageResultItem) => {
    navigator.clipboard.writeText(item.imageUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleStash = (item: ImageResultItem) => {
    onStashPage(item.title, item.imageUrl, `画像解像度: ${item.resolution} (${item.sourceName})`, '画像');
    setStashedId(item.id);
    setTimeout(() => setStashedId(null), 2000);
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            {[{ id: 'all', label: '検索エンジン' }].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 shrink-0 font-medium">
            「<strong>{cleanQ}</strong>」の画像: {filteredImages.length} 件
          </div>
        </div>

        {/* Masonry / Grid Gallery */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              onClick={() => onOpenInAppBrowser?.(img.pageUrl, img.title)}
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer flex flex-col"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-gray-100 text-blue-700">
                  <ImageIcon size={34} />
                  <span className="text-xs font-semibold">実画像を検索</span>
                </div>
                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                  {img.resolution}
                </span>
              </div>

              {/* Card Meta */}
              <div className="p-2.5 flex flex-col justify-between flex-1">
                <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-blue-600">
                  {img.title}
                </h4>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="truncate">{img.sourceName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">
                    {selectedImage.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{selectedImage.sourceName}</span>
                    <span>•</span>
                    <span className="font-mono text-blue-600 font-bold">
                      {selectedImage.resolution}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStash(selectedImage)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Tab Stashに保存"
                  >
                    {stashedId === selectedImage.id ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <BookmarkPlus size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(selectedImage)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                    title="画像URLをコピー"
                  >
                    {copiedId === selectedImage.id ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <Copy size={18} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Image Preview Canvas */}
              <div className="flex-1 bg-gray-950 flex items-center justify-center p-4 overflow-hidden">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenInAppBrowser &&
                        onOpenInAppBrowser(selectedImage.imageUrl, selectedImage.title);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>ソフト内で画像ページを開く</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSearchQuery(`${cleanQ} 類似画像`)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-medium text-xs border border-gray-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Search size={14} />
                    <span>類似の画像を探索</span>
                  </button>
                </div>

                <a
                  href={selectedImage.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 font-medium text-xs border border-gray-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  <span>元サイズでダウンロード</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
