import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogOut,
  X,
  Check,
  Key,
  UserCheck,
  User,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';
import { GoogleUserProfile } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: GoogleUserProfile;
  onUpdateProfile: (updated: GoogleUserProfile) => void;
}

const AVATAR_CHOICES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
];

interface StoredAccount {
  email: string;
  passwordHash: string;
  name: string;
  picture: string;
  sub: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form Fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_CHOICES[0]);

  // Edit Logged-in Profile Fields
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState(AVATAR_CHOICES[0]);

  // Status & Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState(false);

  useEffect(() => {
    if (userProfile.isLoggedIn) {
      setEditName(userProfile.name);
      if (userProfile.picture) setEditAvatar(userProfile.picture);
    }
  }, [userProfile]);

  if (!isOpen) return null;

  // Helper to get stored accounts
  const getStoredAccounts = (): StoredAccount[] => {
    try {
      const stored = localStorage.getItem('myengine_registered_accounts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Helper to save stored accounts
  const saveStoredAccounts = (accounts: StoredAccount[]) => {
    try {
      localStorage.setItem('myengine_registered_accounts', JSON.stringify(accounts));
    } catch {
      // ignore
    }
  };

  // Handle Login with Email & Password
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    if (!email) {
      setErrorMessage('メールアドレスを入力してください');
      return;
    }
    if (!password) {
      setErrorMessage('パスワードを入力してください');
      return;
    }

    const accounts = getStoredAccounts();
    const existing = accounts.find((acc) => acc.email.toLowerCase() === email);

    if (existing) {
      if (existing.passwordHash !== password) {
        setErrorMessage('パスワードが一致しません。正しいパスワードを入力してください');
        return;
      }
      // Log in with existing account
      const loggedInProfile: GoogleUserProfile = {
        sub: existing.sub || `sub-${Date.now()}`,
        name: existing.name,
        email: existing.email,
        picture: existing.picture,
        hd: existing.email.split('@')[1] || 'gmail.com',
        isLoggedIn: true,
      };
      onUpdateProfile(loggedInProfile);
      setToastMsg(`「${existing.name}」としてログインしました`);
      setTimeout(() => setToastMsg(null), 2500);
      return;
    }

    // First time login for this email: register and log in automatically
    const defaultName = email.split('@')[0] ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : 'User';
    const newSub = `google-${Date.now().toString().slice(-8)}`;
    const newAccount: StoredAccount = {
      email,
      passwordHash: password,
      name: defaultName,
      picture: AVATAR_CHOICES[0],
      sub: newSub,
    };

    saveStoredAccounts([...accounts, newAccount]);

    const newProfile: GoogleUserProfile = {
      sub: newSub,
      name: defaultName,
      email,
      picture: AVATAR_CHOICES[0],
      hd: email.split('@')[1] || 'gmail.com',
      isLoggedIn: true,
    };

    onUpdateProfile(newProfile);
    setToastMsg(`Googleアカウントを認証・ログインしました！メイン画面にアイコンとユーザー名が反映されました`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Handle Account Registration with Email, Password, Name & Avatar
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = registerEmail.trim().toLowerCase();
    const defaultFallbackName = email && email.split('@')[0]
      ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
      : 'ユーザー';
    const name = registerName.trim() || defaultFallbackName;
    const password = registerPassword.trim();

    if (!email) {
      setErrorMessage('メールアドレスを入力してください');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('パスワードは4文字以上で入力してください');
      return;
    }

    const accounts = getStoredAccounts();
    const existingIndex = accounts.findIndex((acc) => acc.email.toLowerCase() === email);

    const newSub = `google-${Date.now().toString().slice(-8)}`;
    const newAccount: StoredAccount = {
      email,
      passwordHash: password,
      name,
      picture: selectedAvatar,
      sub: newSub,
    };

    if (existingIndex >= 0) {
      accounts[existingIndex] = newAccount;
      saveStoredAccounts(accounts);
    } else {
      saveStoredAccounts([...accounts, newAccount]);
    }

    const newProfile: GoogleUserProfile = {
      sub: newSub,
      name,
      email,
      picture: selectedAvatar,
      hd: email.split('@')[1] || 'gmail.com',
      isLoggedIn: true,
    };

    onUpdateProfile(newProfile);
    setToastMsg(`新規アカウントを登録しログインしました！メイン画面に反映されました`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Handle Profile Update when Logged In
  const handleUpdateCurrentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = editName.trim() || userProfile.name || 'User';

    const updatedProfile: GoogleUserProfile = {
      ...userProfile,
      name: finalName,
      picture: editAvatar,
    };

    // Also update saved account in localStorage
    const accounts = getStoredAccounts();
    const idx = accounts.findIndex((acc) => acc.email.toLowerCase() === userProfile.email.toLowerCase());
    if (idx >= 0) {
      accounts[idx].name = finalName;
      accounts[idx].picture = editAvatar;
      saveStoredAccounts(accounts);
    }

    onUpdateProfile(updatedProfile);
    setToastMsg('プロファイル情報を更新しました');
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Handle Logout (Back to Guest)
  const handleLogout = () => {
    const guestProfile: GoogleUserProfile = {
      email: '',
      name: 'ゲスト',
      picture: '',
      hd: '',
      sub: '',
      isLoggedIn: false,
    };
    onUpdateProfile(guestProfile);
    setLoginPassword('');
    setRegisterPassword('');
    setErrorMessage(null);
    setToastMsg('ログアウトしました。ゲストアカウントに戻りました');
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200/90 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Googleアカウント認証
              </h2>
              <p className="text-xs text-gray-500">
                {userProfile.isLoggedIn
                  ? 'ログイン中アカウントの管理'
                  : 'メールアドレスとパスワードでログイン'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Status Indicator Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200/80 flex items-center gap-3.5 shadow-2xs">
            <div className="relative">
              {userProfile.isLoggedIn && userProfile.picture ? (
                <img
                  src={userProfile.picture}
                  alt={userProfile.name}
                  referrerPolicy="no-referrer"
                  className="w-13 h-13 rounded-full object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center">
                  <User size={24} />
                </div>
              )}
              <div
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  userProfile.isLoggedIn ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 truncate">
                  {userProfile.isLoggedIn ? userProfile.name : 'ゲストアカウント (未ログイン)'}
                </span>
                {userProfile.isLoggedIn ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                    ログイン中
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                    ゲスト
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 truncate font-mono">
                {userProfile.isLoggedIn
                  ? userProfile.email
                  : 'ログインするとメイン画面にアカウント情報が表示されます'}
              </div>
              {userProfile.isLoggedIn && userProfile.sub && (
                <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 font-mono">
                  <Key size={10} />
                  <span>ID: {userProfile.sub}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback & Errors */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in">
              <X size={14} className="text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {toastMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in">
              <Check size={14} className="text-emerald-600 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* VIEW 1: USER NOT LOGGED IN -> Email & Password Login / Register Tabs */}
          {!userProfile.isLoggedIn ? (
            <div>
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'login'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <LogIn size={13} />
                  <span>メールでログイン</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'register'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <UserPlus size={13} />
                  <span>新規登録</span>
                </button>
              </div>

              {/* Login Form */}
              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">
                      メールアドレス
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="例: user@example.com"
                        required
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">
                      パスワード
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="パスワードを入力"
                        required
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-8 pr-9 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        {showLoginPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white mt-1"
                  >
                    <LogIn size={14} />
                    <span>メールアドレスとパスワードでログイン</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      アカウントをお持ちでない場合は新規登録
                    </button>
                  </div>
                </form>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">
                      表示名（ユーザー名）
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="例: ユーザー名 または お名前"
                        required
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">
                      メールアドレス
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="例: user@example.com"
                        required
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-700 font-medium block mb-1">
                      パスワード
                    </label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="4文字以上のパスワード"
                        required
                        className="w-full text-xs bg-white border border-gray-200 rounded-xl pl-8 pr-9 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        {showRegisterPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Avatar selection for registration */}
                  <div>
                    <span className="text-xs text-gray-600 font-medium block mb-1.5">
                      アバターアイコンの選択:
                    </span>
                    <div className="flex items-center gap-2.5">
                      {AVATAR_CHOICES.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedAvatar(url)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                            selectedAvatar === url
                              ? 'border-blue-600 scale-105 ring-2 ring-blue-100'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="Avatar choice" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white mt-1"
                  >
                    <UserPlus size={14} />
                    <span>アカウントを新規登録してログイン</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      既にアカウントをお持ちの場合はログイン
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* VIEW 2: LOGGED-IN PROFILE MANAGEMENT */
            <div className="space-y-4">
              <form onSubmit={handleUpdateCurrentProfile} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-700 font-medium block mb-1">
                    表示名（ユーザー名）
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <span className="text-xs text-gray-600 font-medium block mb-1.5">
                    Googleアバターアイコンの変更:
                  </span>
                  <div className="flex items-center gap-2.5">
                    {AVATAR_CHOICES.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setEditAvatar(url)}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                          editAvatar === url
                            ? 'border-blue-600 scale-105 ring-2 ring-blue-100'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="Avatar choice" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white"
                >
                  <UserCheck size={14} />
                  <span>プロファイル変更を保存</span>
                </button>
              </form>

              {/* OIDC Claims View */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowTokens(!showTokens)}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>{showTokens ? '▼ OIDC トークンクレームを閉じる' : '▶ OIDC トークンクレームを表示'}</span>
                </button>
                {showTokens && (
                  <pre className="mt-2 p-2.5 bg-gray-900 text-emerald-400 font-mono text-[10px] rounded-xl overflow-x-auto leading-relaxed">
                    {JSON.stringify(
                      {
                        iss: 'https://accounts.google.com',
                        sub: userProfile.sub,
                        email: userProfile.email,
                        email_verified: true,
                        name: userProfile.name,
                        picture: userProfile.picture,
                        hd: userProfile.hd || 'gmail.com',
                        auth_time: Math.floor(Date.now() / 1000) - 120,
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div>
            {userProfile.isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1"
              >
                <LogOut size={13} />
                <span>ゲストに戻る (ログアウト)</span>
              </button>
            )}
          </div>

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
