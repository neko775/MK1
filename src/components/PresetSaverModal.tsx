import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, ArrowRight, X, Check } from 'lucide-react';
import { GeminiModel, SearchFilterState, SearchPreset } from '../types';

interface PresetSaverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuery: string;
  currentModel: GeminiModel;
  currentFilters: SearchFilterState;
  presets: SearchPreset[];
  onSavePreset: (newPreset: SearchPreset) => void;
  onLoadPreset: (preset: SearchPreset) => void;
  onDeletePreset: (id: string) => void;
}

export const PresetSaverModal: React.FC<PresetSaverModalProps> = ({
  isOpen,
  onClose,
  currentQuery,
  currentModel,
  currentFilters,
  presets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPreset: SearchPreset = {
      id: `preset-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'カスタム検索条件セット',
      model: currentModel,
      filters: JSON.parse(JSON.stringify(currentFilters)),
      sampleQuery: currentQuery || '',
      createdAt: new Date().toLocaleDateString('ja-JP'),
    };

    onSavePreset(newPreset);
    setName('');
    setDescription('');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Bookmark size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                検索条件プリセット保存 (Preset Saver)
              </h2>
              <p className="text-xs text-gray-500">
                現在のフィルター・演算子・モデル設定を名前付きで保存・再利用
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

        {/* Form to save current settings */}
        <form onSubmit={handleSave} className="p-4 px-6 bg-gray-50/70 border-b border-gray-200">
          <div className="text-xs font-semibold text-gray-800 mb-2">
            現在の設定を新規プリセットとして保存
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="プリセット名 (例: 厳格コードファクトチェック)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <input
              type="text"
              placeholder="説明 (任意)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-gray-500 flex items-center gap-2">
              <span>モデル: <strong>{currentModel}</strong></span>
              <span>•</span>
              <span>ノイズ除去: {currentFilters.domainBlock ? 'ON' : 'OFF'}</span>
              <span>•</span>
              <span>Pure Clean: {currentFilters.pureCleanMode ? 'ON' : 'OFF'}</span>
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1"
            >
              {savedSuccess ? <Check size={12} className="text-emerald-400" /> : <Plus size={12} />}
              <span>{savedSuccess ? '保存完了!' : '現在の設定を保存'}</span>
            </button>
          </div>
        </form>

        {/* Preset List */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-gray-100 space-y-3">
          <div className="text-xs text-gray-500 font-medium mb-1">
            保存済みプリセット一覧 ({presets.length} 件)
          </div>

          {presets.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              保存されたプリセットはまだありません。上のフォームから現在の検索設定を保存できます。
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="pt-3 first:pt-0 p-3 rounded-xl hover:bg-gray-50/90 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-900">{preset.name}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
                      {preset.model}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mb-1.5">{preset.description}</p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-500">
                    {preset.filters.domainBlock && (
                      <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-100">
                        ノイズ除去
                      </span>
                    )}
                    {preset.filters.pureCleanMode && (
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                        Pure Clean
                      </span>
                    )}
                    {preset.filters.sideBySideCode && (
                      <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                        生コード並列
                      </span>
                    )}
                    {preset.filters.crossEngine && (
                      <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                        5大エンジン横断
                      </span>
                    )}
                    <span className="text-gray-400 ml-1">{preset.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadPreset(preset);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-700 text-xs font-medium rounded-xl transition-all flex items-center gap-1"
                  >
                    <span>適用</span>
                    <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="削除"
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
