import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Star,
  ExternalLink,
  BookmarkPlus,
  Check,
  Compass,
  Layers,
  Search,
  Map as MapIcon,
  Globe,
} from 'lucide-react';

interface MapsViewProps {
  query: string;
  onStashPage: (title: string, url: string, snippet: string, category: string) => void;
  onOpenInAppBrowser?: (url: string, title: string) => void;
  onSearchQuery: (newQuery: string) => void;
}

export interface MapSpotItem {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  openStatus: string;
  phone: string;
  mapUrl: string;
  directionsUrl: string;
  imageUrl: string;
  tags: string[];
}

export const MapsView: React.FC<MapsViewProps> = ({
  query,
  onStashPage,
  onOpenInAppBrowser,
  onSearchQuery,
}) => {
  const cleanQ = query.trim() || '東京駅';
  const [selectedSpot, setSelectedSpot] = useState<MapSpotItem | null>(null);
  const [stashedId, setStashedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'store' | 'spot' | 'gourmet'>('all');

  const spots: MapSpotItem[] = useMemo(() => {
    const encoded = encodeURIComponent(cleanQ);

    return [
      {
        id: 'spot-1',
        name: `「${cleanQ}」総合フラッグシップ本店 & エクスペリエンスストア`,
        category: 'オフィシャルストア',
        address: '東京都千代田区丸の内1丁目9-1',
        distance: '現在地から 1.2 km',
        rating: 4.8,
        reviewCount: 3420,
        openStatus: '営業中 • 21:00 に閉店',
        phone: '03-1234-5678',
        mapUrl: `https://www.google.com/maps/search/${encoded}`,
        directionsUrl: `https://www.google.com/maps/dir//${encoded}`,
        imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
        tags: ['駐車場あり', 'Wi-Fi完備', 'キャッシュレス決済可', 'バリアフリー'],
      },
      {
        id: 'spot-2',
        name: `「${cleanQ}」公認ラボ & コミュニティハブ Tokyo`,
        category: 'コミュニティ施設',
        address: '東京都渋谷区道玄坂1丁目2-3 渋谷マークシティ内',
        distance: '現在地から 3.8 km',
        rating: 4.6,
        reviewCount: 1290,
        openStatus: '営業中 • 22:00 に閉店',
        phone: '03-9876-5432',
        mapUrl: `https://www.google.com/maps/search/${encoded}+渋谷`,
        directionsUrl: `https://www.google.com/maps/dir//${encoded}+渋谷`,
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop&q=80',
        tags: ['イベント開催中', 'コワーキング対応', '公式グッズ販売'],
      },
      {
        id: 'spot-3',
        name: `「${cleanQ}」コンセプトカフェ & ラウンジ`,
        category: 'カフェ・ダイニング',
        address: '東京都港区六本木6丁目10-1 六本木ヒルズ',
        distance: '現在地から 4.5 km',
        rating: 4.7,
        reviewCount: 2150,
        openStatus: '営業中 • 23:00 に閉店',
        phone: '03-5555-4444',
        mapUrl: `https://www.google.com/maps/search/${encoded}+六本木`,
        directionsUrl: `https://www.google.com/maps/dir//${encoded}+六本木`,
        imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
        tags: ['テラス席あり', '限定メニュー', '予約可'],
      },
    ];
  }, [cleanQ]);

  const handleOpenMap = (spot: MapSpotItem) => {
    if (onOpenInAppBrowser) {
      onOpenInAppBrowser(spot.mapUrl, `${spot.name} - 地図`);
    }
  };

  const handleDirections = (spot: MapSpotItem) => {
    if (onOpenInAppBrowser) {
      onOpenInAppBrowser(spot.directionsUrl, `${spot.name} - ルート案内`);
    }
  };

  const handleStash = (spot: MapSpotItem) => {
    onStashPage(spot.name, spot.mapUrl, `住所: ${spot.address} 電話: ${spot.phone}`, '地図');
    setStashedId(spot.id);
    setTimeout(() => setStashedId(null), 2000);
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-4 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-4">
        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  「{cleanQ}」の周辺マップ・店舗・スポット案内
                </h2>
                <span className="bg-blue-600 text-white px-2 py-0.2 rounded-full text-[10px] font-bold">
                  Google Maps / OpenStreetMap 連動
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                営業時間・ルート案内・電話番号・クチコミ評価をソフト内で即座に確認
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenInAppBrowser &&
                  onOpenInAppBrowser(
                    `https://www.google.com/maps/search/${encodeURIComponent(cleanQ)}`,
                    `Google マップ - ${cleanQ}`
                  );
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <MapIcon size={13} />
              <span>全画面マップをソフト内で開く</span>
            </button>
          </div>
        </div>

        {/* Interactive Map Canvas + Spot List 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Interactive Map Viewer (Embedded OpenStreetMap / Satellite representation) */}
          <div className="lg:col-span-7 bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm flex flex-col min-h-[420px]">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-700 font-bold">
                <MapPin size={14} className="text-rose-600" />
                <span>インタラクティブ周辺地図プレビュー</span>
              </div>
              <span className="text-[11px] text-gray-500 font-mono">
                Lat: 35.6812 | Lon: 139.7671 (東京)
              </span>
            </div>

            {/* Embedded Interactive Map iframe */}
            <div className="flex-1 relative bg-slate-100 min-h-[360px]">
              <iframe
                title="Interactive Map"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=139.7000%2C35.6500%2C139.8000%2C35.7200&layer=mapnik&marker=35.6812%2C139.7671`}
                className="w-full h-full border-0"
                loading="lazy"
              />

              {/* Floating Quick Action over Map */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200 shadow-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Navigation size={14} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">ここからのルートを検索</div>
                    <div className="text-[11px] text-gray-500">現在地から車で約 8 分 / 徒歩 20 分</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirections(spots[0])}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  ルート案内開始
                </button>
              </div>
            </div>
          </div>

          {/* Right: Spots & Facilities List */}
          <div className="lg:col-span-5 space-y-3">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {spot.category}
                      </span>
                      <h3
                        onClick={() => handleOpenMap(spot)}
                        className="text-sm font-bold text-gray-900 mt-1 cursor-pointer hover:text-blue-600 transition-colors"
                      >
                        {spot.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                      <Star size={13} fill="currentColor" />
                      <span>{spot.rating}</span>
                      <span className="text-gray-400 font-normal">({spot.reviewCount})</span>
                    </div>
                  </div>

                  {/* Spot Details */}
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">{spot.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-medium">{spot.openStatus}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-400 shrink-0" />
                      <span>{spot.phone}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] text-gray-600">
                    {spot.tags.map((t, idx) => (
                      <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDirections(spot)}
                    className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Navigation size={12} />
                    <span>ルート案内</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenMap(spot)}
                    className="py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors cursor-pointer"
                  >
                    詳細
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStash(spot)}
                    className="p-1.5 rounded-xl border border-gray-200 hover:bg-gray-200 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Tab Stashに保存"
                  >
                    {stashedId === spot.id ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <BookmarkPlus size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
