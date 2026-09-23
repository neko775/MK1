import React from 'react';
import {
  History,
  Compass,
  FolderKanban,
  Code2,
  FileCode2,
  Bookmark,
  Layers,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { GoogleUserProfile } from '../types';

export type ActiveModal =
  | 'history'
  | 'crossEngine'
  | 'tabMemory'
  | 'autoSearch'
  | 'apiCode'
  | 'presetSaver'
  | 'tabStash'
  | 'settings'
  | 'googleAuth'
  | 'commandPalette'
  | null;

interface SidebarProps {
  activeModal: ActiveModal;
  setActiveModal: (modal: ActiveModal) => void;
  stashedCount: number;
  userProfile: GoogleUserProfile;
  pureCleanActive: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModal,
  setActiveModal,
  stashedCount,
  userProfile,
  pureCleanActive,
}) => {
  const topTools = [
    {
      id: 'history' as ActiveModal,
      label: '検索履歴（差分Diffハイライト）',
      icon: History,
      shortcut: 'Cmd+H',
    },
    {
      id: 'crossEngine' as ActiveModal,
      label: '複数エンジン横断比較 (Google/DDG/GitHub/arXiv/X)',
      icon: Compass,
      shortcut: 'Cmd+E',
    },
    {
      id: 'tabMemory' as ActiveModal,
      label: 'タブ＆メモリ管理・一括ZIPダウンロード',
      icon: FolderKanban,
      shortcut: 'Cmd+M',
    },
    {
      id: 'autoSearch' as ActiveModal,
      label: '自動検索エディタ (gemini.eval 巡回ロジック)',
      icon: Code2,
      shortcut: 'Cmd+J',
    },
    {
      id: 'apiCode' as ActiveModal,
      label: 'APIコード自動生成 (cURL / Python / Node.js)',
      icon: FileCode2,
      shortcut: 'Cmd+G',
    },
    {
      id: 'presetSaver' as ActiveModal,
      label: '検索条件プリセット保存 (Preset Saver)',
      icon: Bookmark,
      shortcut: 'Cmd+S',
    },
    {
      id: 'tabStash' as ActiveModal,
      label: '一時保存・Gemini一括解析 (Tab Stash)',
      icon: Layers,
      badge: stashedCount > 0 ? stashedCount : undefined,
      shortcut: 'Cmd+T',
    },
  ];

  return (
    <aside
      id="sidebar-navigation"
      className="fixed left-0 top-0 bottom-0 w-16 bg-white/75 backdrop-blur-lg border-r border-gray-200/70 z-40 flex flex-col justify-between items-center py-4 select-none shadow-[1px_0_12px_rgba(0,0,0,0.02)]"
    >
      {/* Top Group Tools */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Pure Clean Mode indicator dot if enabled */}
        {pureCleanActive && (
          <div
            title="Pure Clean モード稼働中 (履歴非汚染)"
            className="mb-1 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse"
          />
        )}

        {topTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeModal === tool.id;

          return (
            <div key={tool.id} className="relative group flex items-center justify-center">
              <button
                id={`sidebar-btn-${tool.id}`}
                type="button"
                onClick={() => setActiveModal(isActive ? null : tool.id)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 active:scale-95'
                }`}
                aria-label={tool.label}
              >
                <Icon size={20} strokeWidth={1.8} />

                {/* Optional Badge */}
                {tool.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tool.badge}
                  </span>
                )}
              </button>

              {/* Japanese High-Fidelity Tooltip */}
              <div className="absolute left-16 ml-2.5 px-3 py-1.5 bg-gray-900/95 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 flex items-center gap-2">
                <span>{tool.label}</span>
                {tool.shortcut && (
                  <span className="text-[10px] text-gray-400 border border-gray-700 px-1 py-0.5 rounded font-mono">
                    {tool.shortcut}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Group Tools */}
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Settings & Domain Blacklist Manager */}
        <div className="relative group flex items-center justify-center">
          <button
            id="sidebar-btn-settings"
            type="button"
            onClick={() => setActiveModal(activeModal === 'settings' ? null : 'settings')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              activeModal === 'settings'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 active:scale-95'
            }`}
            aria-label="システム設定 & ドメインブラックリスト管理"
          >
            <Settings size={20} strokeWidth={1.8} />
          </button>

          <div className="absolute left-16 ml-2.5 px-3 py-1.5 bg-gray-900/95 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
            <span>システム設定 & ドメインブラックリスト管理</span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-7 h-px bg-gray-200 my-0.5" />

        {/* Google Account Dynamic User Area */}
        <div className="relative group flex items-center justify-center">
          <button
            id="sidebar-btn-user"
            type="button"
            onClick={() => setActiveModal('googleAuth')}
            className={`w-11 h-11 rounded-full p-0.5 border transition-all duration-200 active:scale-95 overflow-hidden flex items-center justify-center bg-white shadow-2xs ${
              userProfile.isLoggedIn
                ? 'border-gray-300/80 hover:border-gray-500'
                : 'border-dashed border-gray-300 hover:border-gray-400'
            }`}
            aria-label={userProfile.isLoggedIn ? `${userProfile.name} (Googleアカウント)` : 'ゲストアカウント (未登録)'}
          >
            {userProfile.isLoggedIn && userProfile.picture ? (
              <img
                src={userProfile.picture}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover"
              />
            ) : userProfile.isLoggedIn ? (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gray-100 text-gray-400 group-hover:text-gray-600 flex items-center justify-center">
                <User size={18} />
              </div>
            )}
          </button>

          {/* User Account Popover Tooltip */}
          <div className="absolute left-16 ml-2.5 p-2.5 bg-white text-gray-800 text-xs rounded-xl shadow-xl border border-gray-200/90 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50 min-w-[200px]">
            {userProfile.isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-gray-900">{userProfile.name}</span>
                </div>
                <div className="text-[11px] text-gray-500 truncate mb-1">{userProfile.email}</div>
                <div className="text-[10px] text-blue-600 bg-blue-50/80 border border-blue-100 rounded px-1.5 py-0.5 inline-flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>Google OAuth 2.0 連携中</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="font-semibold text-gray-700">ゲストアカウント</span>
                </div>
                <div className="text-[11px] text-gray-400 truncate mb-1">未登録・ローカル利用中</div>
                <div className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 inline-flex items-center gap-1 font-medium">
                  <span>クリックしてGoogle連携・登録</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
