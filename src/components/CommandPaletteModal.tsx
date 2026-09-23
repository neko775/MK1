import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Compass,
  History,
  FolderKanban,
  Code2,
  Bookmark,
  Layers,
  Settings,
  Sparkles,
  Share2,
  X,
} from 'lucide-react';
import { ActiveModal } from './Sidebar';
import { GeminiModel } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: string) => void;
  onSelectModel: (model: GeminiModel) => void;
  onToggleFilter: () => void;
  onTogglePureClean: () => void;
  onSharePermalink: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  onSelectModel,
  onToggleFilter,
  onTogglePureClean,
  onSharePermalink,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const commands = [
    {
      id: 'focus-search',
      title: '検索バーへフォーカス',
      category: 'Navigation',
      shortcut: 'Cmd+K',
      icon: Search,
      action: () => {
        onClose();
        document.getElementById('main-search-input')?.focus();
      },
    },
    {
      id: 'toggle-filter',
      title: '🐍 TOP7 フィルターを展開 / 閉じる',
      category: 'Filters',
      shortcut: 'Cmd+Shift+F',
      icon: SlidersHorizontal,
      action: () => {
        onClose();
        onToggleFilter();
      },
    },
    {
      id: 'toggle-pure-clean',
      title: 'Pure Clean モード切り替え (非汚染検索)',
      category: 'Filters',
      shortcut: 'Cmd+Shift+P',
      icon: Sparkles,
      action: () => {
        onClose();
        onTogglePureClean();
      },
    },
    {
      id: 'share-link',
      title: '現在の検索条件をパーマリンクURLとして共有',
      category: 'Sharing',
      shortcut: 'Cmd+L',
      icon: Share2,
      action: () => {
        onClose();
        onSharePermalink();
      },
    },
    {
      id: 'model-3.8',
      title: 'モデル切替: Gemini 3.8',
      category: 'Models',
      shortcut: 'Cmd+1',
      icon: Sparkles,
      action: () => {
        onClose();
        onSelectModel('Gemini 3.8');
      },
    },
    {
      id: 'model-3.1-pro',
      title: 'モデル切替: Gemini 3.1 PRO (高度推論・APIキー連携)',
      category: 'Models',
      shortcut: 'Cmd+2',
      icon: Sparkles,
      action: () => {
        onClose();
        onSelectModel('Gemini 3.1 Pro');
      },
    },
    {
      id: 'model-3.7',
      title: 'モデル切替: Gemini 3.7',
      category: 'Models',
      shortcut: 'Cmd+3',
      icon: Sparkles,
      action: () => {
        onClose();
        onSelectModel('Gemini 3.7');
      },
    },
    {
      id: 'model-3.5',
      title: 'モデル切替: Gemini 3.5',
      category: 'Models',
      shortcut: 'Cmd+4',
      icon: Sparkles,
      action: () => {
        onClose();
        onSelectModel('Gemini 3.5');
      },
    },
    {
      id: 'model-pro',
      title: 'モデル切替: Gemini 3 Pro',
      category: 'Models',
      shortcut: 'Cmd+5',
      icon: Sparkles,
      action: () => {
        onClose();
        onSelectModel('Gemini 3 Pro');
      },
    },
    {
      id: 'model-banana',
      title: 'モデル切替: ナノバナナ',
      category: 'Models',
      shortcut: 'Cmd+6',
      icon: Sparkles,
      action: () => {
        onClose();
        onSelectModel('ナノバナナ');
      },
    },
    {
      id: 'open-cross',
      title: '5大エンジン横断比較モーダルを開く',
      category: 'Tools',
      shortcut: 'Cmd+E',
      icon: Compass,
      action: () => {
        onClose();
        onSelectAction('crossEngine');
      },
    },
    {
      id: 'open-history',
      title: '検索履歴（差分Diffハイライト）を開く',
      category: 'Tools',
      shortcut: 'Cmd+H',
      icon: History,
      action: () => {
        onClose();
        onSelectAction('history');
      },
    },
    {
      id: 'open-tabmemory',
      title: 'タブ＆メモリ管理・ZIPダウンロードを開く',
      category: 'Tools',
      shortcut: 'Cmd+M',
      icon: FolderKanban,
      action: () => {
        onClose();
        onSelectAction('tabMemory');
      },
    },
    {
      id: 'open-autosearch',
      title: '自動検索エディタ (gemini.eval) を開く',
      category: 'Tools',
      shortcut: 'Cmd+J',
      icon: Code2,
      action: () => {
        onClose();
        onSelectAction('autoSearch');
      },
    },
    {
      id: 'open-presets',
      title: '検索条件プリセット保存 (Preset Saver) を開く',
      category: 'Tools',
      shortcut: 'Cmd+S',
      icon: Bookmark,
      action: () => {
        onClose();
        onSelectAction('presetSaver');
      },
    },
    {
      id: 'open-stash',
      title: '一時保存 (Tab Stash 保管庫) を開く',
      category: 'Tools',
      shortcut: 'Cmd+T',
      icon: Layers,
      action: () => {
        onClose();
        onSelectAction('tabStash');
      },
    },
    {
      id: 'open-settings',
      title: 'システム設定 & ドメインブラックリストを開く',
      category: 'System',
      shortcut: 'Cmd+,',
      icon: Settings,
      action: () => {
        onClose();
        onSelectAction('settings');
      },
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[70vh]"
        role="dialog"
      >
        {/* Search header */}
        <div className="p-3.5 px-4 border-b border-gray-200 flex items-center gap-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder="コマンドを検索、またはキーを入力..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          <span className="text-[10px] text-gray-400 font-mono border border-gray-200 px-1.5 py-0.5 rounded">
            ESC
          </span>
        </div>

        {/* Command list */}
        <div className="p-2 overflow-y-auto flex-1 divide-y divide-gray-50">
          {filteredCommands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                type="button"
                onClick={cmd.action}
                className="w-full p-2.5 px-3 rounded-xl hover:bg-gray-100 flex items-center justify-between text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-white text-gray-700">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-800">{cmd.title}</div>
                    <div className="text-[10px] text-gray-400">{cmd.category}</div>
                  </div>
                </div>

                {cmd.shortcut && (
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                    {cmd.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-2.5 px-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>↑↓ ナビゲート | Enter 選択</span>
          <span>Cmd+K でいつでも起動</span>
        </div>
      </div>
    </div>
  );
};
