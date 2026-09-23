import React from 'react';
import {
  ShieldAlert,
  Clock,
  CodeXml,
  Terminal,
  Sparkles,
  Lock,
  Compass,
  RotateCcw,
  Check,
} from 'lucide-react';
import { SearchFilterState } from '../types';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilterState;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilterState>>;
  onOpenSettingsBlacklist?: () => void;
  onOpenCrossEngine?: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  onOpenSettingsBlacklist,
  onOpenCrossEngine,
}) => {
  if (!isOpen) return null;

  const activeCount = [
    filters.domainBlock,
    filters.exactTimeRange,
    filters.sideBySideCode,
    filters.programmableOps.minChars > 0 ||
      filters.programmableOps.maxChars < 10000 ||
      filters.programmableOps.langVersion !== '' ||
      filters.programmableOps.regexPattern !== '',
    filters.pureCleanMode,
    filters.paywallFilter !== 'off',
    filters.crossEngine,
  ].filter(Boolean).length;

  const handleReset = () => {
    setFilters({
      domainBlock: true,
      blockedDomains: [
        'sejuku.net',
        'qiita.com/spam',
        'zenn.dev/low-quality',
        'curation-matome.jp',
        'content-farm.com',
      ],
      exactTimeRange: false,
      timeStart: '',
      timeEnd: '',
      sideBySideCode: true,
      programmableOps: {
        minChars: 0,
        maxChars: 10000,
        langVersion: '',
        regexPattern: '',
      },
      pureCleanMode: false,
      paywallFilter: 'off',
      crossEngine: false,
    });
  };

  return (
    <div
      id="filter-dropdown-menu"
      className="absolute top-full left-0 mt-2.5 w-[calc(100vw-2rem)] max-w-[460px] sm:w-[460px] bg-white/95 backdrop-blur-xl border border-gray-200/90 rounded-2xl shadow-2xl p-4 z-50 text-gray-800 text-xs animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <span>🐍</span> ヘビーユーザー向けTOP 7 フィルター
          </span>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
            {activeCount} 有効
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-gray-400 hover:text-gray-700 text-[11px] flex items-center gap-1 transition-colors"
          title="初期設定に戻す"
        >
          <RotateCcw size={12} />
          <span>リセット</span>
        </button>
      </div>

      <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1">
        {/* 1. 完全ノイズ除去・ドメインブロック */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <ShieldAlert size={15} className="text-rose-500" />
              <span>1. 完全ノイズ除去・ドメインブロック</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.domainBlock}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, domainBlock: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            SEOスパム・低品質キュレーション ({filters.blockedDomains.length} 件) を結果から完全追放
          </p>
          {filters.domainBlock && (
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-gray-500 font-mono">
                {filters.blockedDomains.slice(0, 3).join(', ')} ...
              </span>
              {onOpenSettingsBlacklist && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettingsBlacklist();
                  }}
                  className="text-blue-600 hover:underline"
                >
                  設定で管理
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. 秒単位の期間絶対指定 */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <Clock size={15} className="text-amber-500" />
              <span>2. 秒単位の期間絶対指定</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.exactTimeRange}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, exactTimeRange: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          {filters.exactTimeRange && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-500 block mb-0.5">開始時刻 (秒単位)</span>
                <input
                  type="datetime-local"
                  step="1"
                  value={filters.timeStart}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, timeStart: e.target.value }))
                  }
                  className="w-full text-[11px] bg-white border border-gray-200 rounded-lg p-1 font-mono text-gray-700"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block mb-0.5">終了時刻 (秒単位)</span>
                <input
                  type="datetime-local"
                  step="1"
                  value={filters.timeEnd}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, timeEnd: e.target.value }))
                  }
                  className="w-full text-[11px] bg-white border border-gray-200 rounded-lg p-1 font-mono text-gray-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. AI要約＋ソース/生コード併記 */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <CodeXml size={15} className="text-indigo-500" />
              <span>3. AI要約＋ソース/生コード併記</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sideBySideCode}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sideBySideCode: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            ファクトチェック用にAI要約とオリジナル原典コードを左右に並列レンダリング
          </p>
        </div>

        {/* 4. 高度プログラマブル演算子 */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <Terminal size={15} className="text-violet-500" />
              <span>4. 高度プログラマブル演算子</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-[10px] text-gray-500 block">言語/フレームワーク版</span>
              <input
                type="text"
                placeholder="e.g. Python 3.12 / React 19"
                value={filters.programmableOps.langVersion}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    programmableOps: { ...prev.programmableOps, langVersion: e.target.value },
                  }))
                }
                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block">Regex パターン指定</span>
              <input
                type="text"
                placeholder="e.g. ^export\s+default"
                value={filters.programmableOps.regexPattern}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    programmableOps: { ...prev.programmableOps, regexPattern: e.target.value },
                  }))
                }
                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-mono"
              />
            </div>
          </div>
        </div>

        {/* 5. Pure Cleanモード */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <Sparkles size={15} className="text-emerald-600" />
              <span>5. Pure Clean モード (Cmd+Shift+P)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.pureCleanMode}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, pureCleanMode: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            パーソナライズ・過去閲覧履歴に汚染されない無汚染検索。純粋な客観結果のみ抽出
          </p>
        </div>

        {/* 6. ペイウォール透過・フィルタ */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <Lock size={15} className="text-blue-500" />
              <span>6. ペイウォール透過・フィルタ</span>
            </div>
          </div>
          <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200 text-[11px]">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, paywallFilter: 'off' }))}
              className={`flex-1 py-1 rounded-md text-center transition-all ${
                filters.paywallFilter === 'off'
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              通常
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, paywallFilter: 'bypass' }))}
              className={`flex-1 py-1 rounded-md text-center transition-all ${
                filters.paywallFilter === 'bypass'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              透過プレビュー
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, paywallFilter: 'exclude' }))}
              className={`flex-1 py-1 rounded-md text-center transition-all ${
                filters.paywallFilter === 'exclude'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              完全除外
            </button>
          </div>
        </div>

        {/* 7. 複数エンジン横断比較 */}
        <div className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-gray-800">
              <Compass size={15} className="text-purple-600" />
              <span>7. 複数エンジン横断比較 (Google/DDG/GitHub/arXiv/X)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.crossEngine}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFilters((prev) => ({ ...prev, crossEngine: checked }));
                  if (checked && onOpenCrossEngine) {
                    onOpenCrossEngine();
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            検索実行時、主要5大エンジンを並列マルチカラムで同時展開
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs"
        >
          完了
        </button>
      </div>
    </div>
  );
};
