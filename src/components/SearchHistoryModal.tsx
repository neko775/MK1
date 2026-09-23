import React, { useState } from 'react';
import { History, ArrowRight, Trash2, X, Search, RotateCcw } from 'lucide-react';
import { SearchHistoryItem } from '../types';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SearchHistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
}

// Compute diff between two queries (added words in green, removed in red)
function computeQueryDiff(oldQ: string, newQ: string) {
  const oldTokens = oldQ.trim().split(/\s+/).filter(Boolean);
  const newTokens = newQ.trim().split(/\s+/).filter(Boolean);

  const added = newTokens.filter((t) => !oldTokens.includes(t));
  const removed = oldTokens.filter((t) => !newTokens.includes(t));
  const unchanged = newTokens.filter((t) => oldTokens.includes(t));

  return { added, removed, unchanged };
}

export const SearchHistoryModal: React.FC<SearchHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectQuery,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) =>
    item.query.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                検索履歴（差分Diffハイライト）
              </h2>
              <p className="text-xs text-gray-500">
                クエリの変更・追加単語をカラー差分でリアルタイム可視化
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 size={13} />
                <span>全消去</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="p-3 px-6 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2">
          <Search size={15} className="text-gray-400" />
          <input
            type="text"
            placeholder="履歴内をキーワード検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* List of History Items */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-gray-100 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              検索履歴はまだありません。検索を実行すると自動記録されます。
            </div>
          ) : (
            filteredHistory.map((item, idx) => {
              const prevItem = filteredHistory[idx + 1];
              const diff = prevItem ? computeQueryDiff(prevItem.query, item.query) : null;

              return (
                <div
                  key={item.id}
                  className="pt-3 first:pt-0 group hover:bg-gray-50/80 p-2.5 rounded-xl transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-900 font-mono break-all">
                          {item.query}
                        </span>
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {item.model}
                        </span>
                      </div>

                      {/* Diff Visualization */}
                      {diff && (diff.added.length > 0 || diff.removed.length > 0) && (
                        <div className="mt-1.5 p-2 rounded-lg bg-gray-100/70 text-[11px] font-mono flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-gray-400 mr-1">差分:</span>
                          {diff.unchanged.map((token, tIdx) => (
                            <span key={tIdx} className="text-gray-600">
                              {token}
                            </span>
                          ))}
                          {diff.added.map((token, tIdx) => (
                            <span
                              key={`add-${tIdx}`}
                              className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium"
                            >
                              +{token}
                            </span>
                          ))}
                          {diff.removed.map((token, tIdx) => (
                            <span
                              key={`del-${tIdx}`}
                              className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded line-through"
                            >
                              -{token}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-3">
                        <span>{item.timestamp}</span>
                        {item.filters.pureCleanMode && (
                          <span className="text-emerald-600 font-medium">Pure Clean</span>
                        )}
                        {item.filters.domainBlock && <span>ノイズ除去</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectQuery(item.query);
                        onClose();
                      }}
                      className="opacity-90 group-hover:opacity-100 px-3 py-1.5 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-medium rounded-lg transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>呼出</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>全 {history.length} 件のクエリ差分ログを保存中</span>
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
