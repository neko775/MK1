import React, { useState } from 'react';
import { Layers, Sparkles, Trash2, ExternalLink, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { StashedPage } from '../types';

interface TabStashModalProps {
  isOpen: boolean;
  onClose: () => void;
  stashedPages: StashedPage[];
  onRemovePage: (id: string) => void;
  onClearAll: () => void;
  onAnalyzeWithGemini: (pages: StashedPage[]) => void;
}

export const TabStashModal: React.FC<TabStashModalProps> = ({
  isOpen,
  onClose,
  stashedPages,
  onRemovePage,
  onClearAll,
  onAnalyzeWithGemini,
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartAnalysis = () => {
    setAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult(
        `【Gemini 3.8 一括解析サマリー報告】\n\n` +
          `保管庫内の ${stashedPages.length} 件の技術リソースを横断統合しました:\n\n` +
          `1. アーキテクチャ共通点: すべて非同期ストリーミングとクライアント側のバンドルサイズ削減に焦点を当てています。\n` +
          `2. 競合・相違点: レガシーSSRフレームワークと新世代エッジランタイムでのメモリオーバーヘッドに約3.2倍の差異が観測されています。\n` +
          `3. 推奨アクションプラン: 依存関係の最新化を行い、サーバーコンポーネント境界でのキャッシュ戦略を適用してください。`
      );
      onAnalyzeWithGemini(stashedPages);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                一時保存 (Tab Stash 保管庫)
              </h2>
              <p className="text-xs text-gray-500">
                気になるページを即時ストックし、Geminiに一括横断解析を指示
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

        {/* Action Banner */}
        <div className="p-4 px-6 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            ストック中: <strong className="text-gray-900">{stashedPages.length}</strong> 件のWebページ
          </div>
          <div className="flex items-center gap-2">
            {stashedPages.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                全クリア
              </button>
            )}
            <button
              type="button"
              onClick={handleStartAnalysis}
              disabled={stashedPages.length === 0 || analyzing}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={13} />
              <span>{analyzing ? '横断解析中...' : 'Geminiで一括解析'}</span>
            </button>
          </div>
        </div>

        {/* Analysis Result Display */}
        {analysisResult && (
          <div className="p-4 px-6 bg-indigo-50/80 border-b border-indigo-100 text-xs text-indigo-950 font-sans leading-relaxed animate-in fade-in duration-200">
            <div className="flex items-center justify-between font-bold mb-1 text-indigo-900">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-indigo-600" />
                <span>一括解析レポート生成完了</span>
              </span>
              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                className="text-indigo-500 hover:text-indigo-800 text-[10px]"
              >
                閉じる
              </button>
            </div>
            <p className="whitespace-pre-line text-[11px] text-indigo-900/90">{analysisResult}</p>
          </div>
        )}

        {/* Stashed Page List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {stashedPages.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              現在Tab Stashは空です。検索結果や横断比較画面の「🔖」ボタンからいつでも保管できます。
            </div>
          ) : (
            stashedPages.map((page) => (
              <div
                key={page.id}
                className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/70 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-900 truncate">{page.title}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                      {page.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 line-clamp-2 mb-1 leading-relaxed">
                    {page.snippet}
                  </p>
                  <div className="text-[10px] text-gray-400 font-mono flex items-center gap-3">
                    <span className="truncate max-w-[240px]">{page.url}</span>
                    <span>{page.stashedAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                    title="元ページを開く"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    type="button"
                    onClick={() => onRemovePage(page.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="保管庫から除外"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-white border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs hover:bg-black transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
