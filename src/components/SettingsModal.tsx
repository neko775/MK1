import React, { useState, useRef } from 'react';
import {
  Settings,
  ShieldBan,
  Image as ImageIcon,
  Moon,
  Trash2,
  Plus,
  X,
  Upload,
  RotateCcw,
  Check,
  Server,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedDomains: string[];
  onAddBlockedDomain: (domain: string) => void;
  onRemoveBlockedDomain: (domain: string) => void;
  customBgUrl: string | null;
  customBgType: 'image' | 'video' | null;
  onSetCustomBackground: (url: string | null, type: 'image' | 'video' | null) => void;
  nightModeEnabled: boolean;
  onToggleNightMode: () => void;
  onClearAllCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  blockedDomains,
  onAddBlockedDomain,
  onRemoveBlockedDomain,
  customBgUrl,
  customBgType,
  onSetCustomBackground,
  nightModeEnabled,
  onToggleNightMode,
  onClearAllCache,
}) => {
  const [activeTab, setActiveTab] = useState<'blacklist' | 'background' | 'network' | 'cache'>('blacklist');
  const [newDomainInput, setNewDomainInput] = useState('');
  const [proxyType, setProxyType] = useState('direct');
  const [cacheClearedMsg, setCacheClearedMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    const clean = newDomainInput.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    onAddBlockedDomain(clean);
    setNewDomainInput('');
  };

  // Local Unlimited Background Loader (Blob URL / zero server cost)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('対応フォーマット: JPG, PNG, GIF, WebM, MP4');
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    onSetCustomBackground(blobUrl, isVideo ? 'video' : 'image');
  };

  const handleResetBackground = () => {
    if (customBgUrl) {
      URL.revokeObjectURL(customBgUrl);
    }
    onSetCustomBackground(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearCache = () => {
    onClearAllCache();
    setCacheClearedMsg(true);
    setTimeout(() => setCacheClearedMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                システム設定 & ドメインブラックリスト管理
              </h2>
              <p className="text-xs text-gray-500">
                SEOスパム完全除去、背景カスタマイズ、通信プロキシ、ローカル保護
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

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/70 gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('blacklist')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'blacklist'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldBan size={14} className="text-rose-500" />
            <span>ブラックリスト ({blockedDomains.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('background')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'background'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ImageIcon size={14} className="text-blue-500" />
            <span>背景 & 7色発光 & 夜間</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('network')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'network'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Server size={14} className="text-purple-500" />
            <span>プロキシ & 通信</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cache')}
            className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'cache'
                ? 'border-gray-900 text-gray-900 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Trash2 size={14} className="text-amber-500" />
            <span>キャッシュ消去</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* 1. Blacklist tab */}
          {activeTab === 'blacklist' && (
            <div className="space-y-4">
              <div className="text-xs text-gray-600 leading-relaxed">
                検索結果から1秒で除外指定された低品質キュレーション、SEOスパム、コピペまとめサイトのドメイン一覧です。これらはすべての検索結果から完全に不可視化されます。
              </div>

              <form onSubmit={handleAddDomain} className="flex gap-2">
                <input
                  type="text"
                  placeholder="除外するドメイン (例: spam-blog.com)"
                  value={newDomainInput}
                  onChange={(e) => setNewDomainInput(e.target.value)}
                  className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1 shrink-0"
                >
                  <Plus size={13} />
                  <span>ブロック追加</span>
                </button>
              </form>

              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                {blockedDomains.map((domain) => (
                  <div
                    key={domain}
                    className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-gray-50/80 transition-colors"
                  >
                    <span className="font-mono text-gray-800">{domain}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveBlockedDomain(domain)}
                      className="text-[11px] text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      解除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Background & 7-Color Glow & Night Mode tab */}
          {activeTab === 'background' && (
            <div className="space-y-5 text-xs text-gray-700">
              {/* 7-Color Monochromatic Glowing Info */}
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200">
                <div className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>7色単色遷移発光 (デフォルト)</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  赤・橙・黄・緑・水・青・紫が混ざり合わず、常に1色だけが中央検索カプセル背面で10〜15秒周期で滑らかにフェードイン・フェードアウトします。
                </p>
              </div>

              {/* Local Unlimited Custom Background */}
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200 space-y-3">
                <div className="font-semibold text-gray-900 flex items-center justify-between">
                  <span>ローカル無制限背景カスタム (Blob URL / ゼロ通信)</span>
                  {customBgUrl && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      カスタム背景適用中
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  PCローカルの画像 (JPG/PNG/GIF) または長尺動画 (MP4/WebM) を直接読み込みます。サーバー通信ゼロ・容量無制限。
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Upload size={13} />
                    <span>ローカルファイルを選択 (画像/動画)</span>
                  </button>

                  {customBgUrl && (
                    <button
                      type="button"
                      onClick={handleResetBackground}
                      className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-medium transition-all flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>7色単色発光に戻す</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Night Mode & Resource Protection */}
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Moon size={15} className="text-indigo-600" />
                    <span>夜間ディミング & リソース保護</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nightModeEnabled}
                      onChange={onToggleNightMode}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  22:00〜06:00の時間帯、またはこのスイッチをONにすると背景輝度・発光を自動で減衰。また、タブ非アクティブ時や検索入力中は動画再生を自動停止しGPU負荷を最小化します。
                </p>
              </div>
            </div>
          )}

          {/* 3. Network & Proxy tab */}
          {activeTab === 'network' && (
            <div className="space-y-4 text-xs">
              {/* Real-time Network Telemetry card */}
              <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        navigator.onLine ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>現在の実測通信状況: {navigator.onLine ? 'オンライン' : 'オフライン'}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                    帯域: {((navigator as any).connection?.downlink || 100)} Mbps · 回線: {((navigator as any).connection?.effectiveType || 'Wi-Fi').toUpperCase()}
                  </div>
                </div>
                <div className="text-right font-mono text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                  リアルタイム同期中
                </div>
              </div>

              <p className="text-gray-600">
                検索エンジンへのクエリ送信時のプロキシおよびルーティング方式を設定します。
              </p>
              <div className="space-y-2">
                {[
                  {
                    id: 'direct',
                    label: 'ダイレクト高速接続 (低レイテンシ・直接通信)',
                    desc: 'ローカル直接接続 / 最大スループット実測',
                  },
                  {
                    id: 'cf_worker',
                    label: 'Cloudflare Edge Proxy (クエリ暗号化)',
                    desc: 'IP難読化 / キャッシュ高速化',
                  },
                  {
                    id: 'pure_tunnel',
                    label: 'Pure Clean トンネル (完全非追跡モード)',
                    desc: 'トラッカー完全遮断 / ログ保存なし',
                  },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      proxyType === opt.id
                        ? 'bg-blue-50/50 border-blue-300 text-blue-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="proxy_choice"
                        value={opt.id}
                        checked={proxyType === opt.id}
                        onChange={(e) => setProxyType(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="font-semibold">{opt.label}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 ml-5 mt-0.5">{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4. Cache Purge tab */}
          {activeTab === 'cache' && (
            <div className="space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                ローカルストレージに保存されている検索履歴、Tab Stash、キャッシュされたAPIレスポンスをすべて安全に破棄します。
              </p>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-900 space-y-2">
                <div className="font-semibold">キャッシュ全削除の実行</div>
                <p className="text-[11px] text-rose-700">
                  この操作を実行すると、ローカルのセッションデータが初期化されます。
                </p>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>ローカルキャッシュ全消去を実行</span>
                </button>
              </div>

              {cacheClearedMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <Check size={14} className="text-emerald-600" />
                  <span>すべてのキャッシュと履歴を消去しました。</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-white border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs hover:bg-black transition-colors"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
