'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors">
          🦅 台灣鳥類寶可夢圖鑑
        </Link>
        
        <div>
          {user ? (
            <div className="flex items-center gap-3 sm:gap-6">
              {/* 頁面切換按鈕 */}
              <Link href="/" className="text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors hidden sm:block">
                🏠 圖鑑
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors">
                🎒 我的背包
              </Link>

              {/* 新增紀錄按鈕 */}
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm flex items-center gap-1"
              >
                <span className="hidden sm:inline">➕</span> 新增紀錄
              </button>

              {/* 顯示 Google 帳號的名字與頭像 */}
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200 hidden sm:block" />
              )}
              
              {/* 登出按鈕 */}
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors ml-2">
                登出
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              使用 Google 登入
            </button>
          )}
        </div>
      </div>
    </header>
  );
}