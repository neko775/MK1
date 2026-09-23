import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Star,
  ExternalLink,
  BookmarkPlus,
  Check,
  TrendingDown,
  Truck,
  ShieldCheck,
  Tag,
  Store,
  Filter,
  ArrowUpDown,
  ShoppingCart,
  Percent,
} from 'lucide-react';

interface ShoppingViewProps {
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
  onOpenInAppBrowser?: (url: string, title: string) => void;
  onSearchQuery: (newQuery: string) => void;
}

export interface ShoppingProductItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  storeName: string;
  storeLogoColor: string;
  rating: number;
  reviewCount: number;
  freeShipping: boolean;
  pointsText: string;
  imageUrl: string;
  productUrl: string;
  badge?: string;
  inStock: boolean;
  features: string[];
}

export const ShoppingView: React.FC<ShoppingViewProps> = ({
  query,
  onStashPage,
  onOpenInAppBrowser,
  onSearchQuery,
}) => {
  const cleanQ = query.trim() || 'ゲーム';
  const [stashedId, setStashedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'rating'>('relevance');
  const [freeShippingOnly, setFreeShippingOnly] = useState(false);

  // Generate realistic shopping products dataset
  const rawProducts: ShoppingProductItem[] = useMemo(() => {
    const encoded = encodeURIComponent(cleanQ);

    return [
      {
        id: 'shop-amazon-1',
        title: `【Amazon.co.jp限定】「${cleanQ}」公式プレミアムエディション (特典コード & 特製ガイドブック付き)`,
        price: 7980,
        originalPrice: 9800,
        storeName: 'Amazon.co.jp',
        storeLogoColor: 'bg-amber-600',
        rating: 4.7,
        reviewCount: 2840,
        freeShipping: true,
        pointsText: '80pt (1%)',
        imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        productUrl: `https://www.amazon.co.jp/s?k=${encoded}`,
        badge: 'ベストセラー1位',
        inStock: true,
        features: ['翌日お届け', '国内正規品', 'メーカー1年保証付き'],
      },
      {
        id: 'shop-rakuten-1',
        title: `【楽天市場公式】「${cleanQ}」スタンダードモデル + お買い物マラソン限定ポイント10倍`,
        price: 6850,
        originalPrice: 7500,
        storeName: '楽天市場',
        storeLogoColor: 'bg-rose-600',
        rating: 4.6,
        reviewCount: 1420,
        freeShipping: true,
        pointsText: '685pt (10倍)',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
        productUrl: `https://search.rakuten.co.jp/search/mall/${encoded}/`,
        badge: 'ポイント高還元',
        inStock: true,
        features: ['ポイント10倍', '即日発送', '送料無料'],
      },
      {
        id: 'shop-yahoo-1',
        title: `「${cleanQ}」プロフェッショナルマスターパック (Yahoo!ショッピング優良配送)`,
        price: 8400,
        originalPrice: 8900,
        storeName: 'Yahoo!ショッピング',
        storeLogoColor: 'bg-red-600',
        rating: 4.5,
        reviewCount: 980,
        freeShipping: true,
        pointsText: '420pt (PayPay)',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80',
        productUrl: `https://shopping.yahoo.co.jp/search?p=${encoded}`,
        badge: '優良配送',
        inStock: true,
        features: ['PayPay支払い対応', '当日発送対応'],
      },
      {
        id: 'shop-kakaku-1',
        title: `【最安値比較】「${cleanQ}」全国主要ショップ最安値比較 & 価格推移グラフ`,
        price: 5980,
        originalPrice: 8800,
        storeName: '価格.com (最安値情報)',
        storeLogoColor: 'bg-blue-700',
        rating: 4.8,
        reviewCount: 3100,
        freeShipping: false,
        pointsText: '最安値更新',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        productUrl: `https://kakaku.com/search_results/${encoded}/`,
        badge: '価格.com 最安値',
        inStock: true,
        features: ['全国ショップ価格比較', '価格推移アラート'],
      },
      {
        id: 'shop-yodobashi-1',
        title: `ヨドバシ.com - 「${cleanQ}」ゴールドポイント10%還元・即日配達対応`,
        price: 7480,
        originalPrice: 7480,
        storeName: 'ヨドバシカメラ',
        storeLogoColor: 'bg-red-700',
        rating: 4.9,
        reviewCount: 1890,
        freeShipping: true,
        pointsText: '748pt (10%)',
        imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=80',
        productUrl: `https://www.yodobashi.com/?word=${encoded}`,
        badge: 'ゴールドポイント10%',
        inStock: true,
        features: ['ヨドバシ極速配達', '10%ゴールドポイント', '店頭受取可'],
      },
      {
        id: 'shop-mercari-1',
        title: `メルカリ - 「${cleanQ}」新品未開封・美品・コレクション出品一覧`,
        price: 4500,
        originalPrice: 7000,
        storeName: 'メルカリ (フリマ)',
        storeLogoColor: 'bg-red-500',
        rating: 4.7,
        reviewCount: 4200,
        freeShipping: true,
        pointsText: 'メルペイ決済可',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
        productUrl: `https://jp.mercari.com/search?keyword=${encoded}`,
        badge: 'フリマ特価',
        inStock: true,
        features: ['匿名配送', '即購入OK', 'メルペイ対応'],
      },
    ];
  }, [cleanQ]);

  // Sorting & Filtering
  const displayedProducts = useMemo(() => {
    let list = [...rawProducts];
    if (freeShippingOnly) {
      list = list.filter((p) => p.freeShipping);
    }
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [rawProducts, sortBy, freeShippingOnly]);

  const lowestPrice = useMemo(() => {
    return Math.min(...rawProducts.map((p) => p.price));
  }, [rawProducts]);

  const handleStash = (item: ShoppingProductItem) => {
    onStashPage(
      item.title,
      item.productUrl,
      `価格: ¥${item.price.toLocaleString()} (${item.storeName}) 評価: ★${item.rating}`,
      'ショッピング'
    );
    setStashedId(item.id);
    setTimeout(() => setStashedId(null), 2000);
  };

  const handleProductClick = (item: ShoppingProductItem) => {
    if (onOpenInAppBrowser) {
      onOpenInAppBrowser(item.productUrl, `${item.storeName} - ${item.title}`);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Shopping Header Banner with Price Match Highlight */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  「{cleanQ}」の総合ショッピング比較
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  最安値 ¥{lowestPrice.toLocaleString()}〜
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Amazon、楽天、Yahoo!、ヨドバシ、メルカリなどの価格・在庫・ポイント還元を一括比較
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSearchQuery(`${cleanQ} セール 最安値`)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              🔥 セール情報を再検索
            </button>
          </div>
        </div>

        {/* Filters & Sorting Bar */}
        <div className="bg-white rounded-2xl p-3 border border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFreeShippingOnly(!freeShippingOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                freeShippingOnly
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              <Truck size={13} />
              <span>送料無料のみ</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium">並び替え:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-300 rounded-xl px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
            >
              <option value="relevance">おすすめ順</option>
              <option value="price-asc">価格が安い順 (最安値)</option>
              <option value="price-desc">価格が高い順</option>
              <option value="rating">評価が高い順</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProducts.map((p) => {
            const discount = p.originalPrice
              ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
              : 0;

            return (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Image + Store Tag */}
                  <div className="relative aspect-16/10 bg-gray-100 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Store Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs ${p.storeLogoColor}`}
                      >
                        {p.storeName}
                      </span>
                      {p.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          {p.badge}
                        </span>
                      )}
                    </div>

                    {discount > 0 && (
                      <div className="absolute top-3 right-3 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-0.5">
                        <TrendingDown size={11} />
                        <span>{discount}% OFF</span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2.5">
                    <h3
                      onClick={() => handleProductClick(p)}
                      className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug cursor-pointer group-hover:text-blue-600 transition-colors"
                    >
                      {p.title}
                    </h3>

                    {/* Price Block */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-rose-600">
                        ¥{p.price.toLocaleString()}
                      </span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ¥{p.originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500 font-medium">(税込)</span>
                    </div>

                    {/* Rating & Points */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} fill="currentColor" />
                        <span>{p.rating}</span>
                        <span className="text-gray-400 font-normal">
                          ({p.reviewCount.toLocaleString()})
                        </span>
                      </div>

                      <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {p.pointsText}
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-gray-600">
                      {p.features.map((f, idx) => (
                        <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded-md">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleProductClick(p)}
                    className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShoppingCart size={13} />
                    <span>ソフト内でストアを開く</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStash(p)}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-gray-200 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Tab Stashに保存"
                  >
                    {stashedId === p.id ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <BookmarkPlus size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
