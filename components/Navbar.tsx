'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import type { Bird } from '@/types/bird';
import UploadModal from '@/components/UploadModal'; // 【新增】引入上傳視窗

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 【新增】在上傳視窗需要的狀態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [birds, setBirds] = useState<Bird[]>([]);

  useEffect(() => {
    // 1. 檢查登入狀態
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 2. 抓取鳥類清單 (供上傳視窗搜尋用)
    supabase.from('birds').select('*').order('編號', { ascending: true }).then(({ data }) => {
      if (data) setBirds(data as Bird[]);
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

  // 【修改】直接控制視窗開關，不再需要發送廣播指令了
  const handleUploadClick = () => {
    if (!user) {
      alert('請先登入才能上傳照片、解鎖圖鑑喔！🦅');
      handleLogin();
    } else {
      setIsModalOpen(true); // 直接打開上傳視窗！
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          
          <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors">
            🦅 台灣鳥類圖鑑
          </Link>
          
          <div className="flex items-center gap-3 sm:gap-6">
            
            {/* 電腦版導覽列 */}
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/" className="text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors">
                🏠 圖鑑
              </Link>
              <Link href="/profile" className="text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors">
                🎒 我的背包
              </Link>
              <Link href="/leaderboard" className="text-slate-600 hover:text-emerald-600 font-bold text-sm transition-colors">
                🏆 排行榜
              </Link>
            </div>

            {/* 新增紀錄按鈕 */}
            <button 
              onClick={handleUploadClick}
              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 sm:px-4 py-2 rounded-full text-sm font-bold transition-colors shadow-sm flex items-center gap-1"
            >
              <span className="hidden sm:inline">➕</span> 新增紀錄
            </button>

            {/* 電腦版登入與登出 */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-3 sm:pl-6">
              {user ? (
                <>
                  {user.user_metadata?.avatar_url && (
                    <img src={user.user_metadata.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-slate-200" />
                  )}
                  <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">
                    登出
                  </button>
                </>
              ) : (
                <button onClick={handleLogin} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                  登入
                </button>
              )}
            </div>

            {/* 手機版漢堡選單按鈕 */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>
        </div>

        {/* 手機版下拉選單 */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-t border-slate-100 px-4 py-4 flex flex-col gap-2 shadow-inner absolute w-full left-0">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 font-bold text-base block py-3 border-b border-slate-50">
              🏠 圖鑑首頁
            </Link>
            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 font-bold text-base block py-3 border-b border-slate-50">
              🎒 我的背包
            </Link>
            <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 font-bold text-base block py-3 border-b border-slate-50">
              🏆 全台排行榜
            </Link>
            
            <div className="pt-4 pb-2">
              {user ? (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="avatar" className="w-10 h-10 rounded-full border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg">👤</div>
                    )}
                    <span className="font-bold text-slate-700">{user.user_metadata?.full_name || '鳥友'}</span>
                  </div>
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="text-sm bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold">
                    登出
                  </button>
                </div>
              ) : (
                <button onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-sm">
                  使用 Google 登入
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 【新增】全站共用的上傳視窗，在哪個頁面點擊都能彈出來！ */}
      {isModalOpen && user && (
        <UploadModal 
          user={user} 
          birds={birds} 
          onClose={() => setIsModalOpen(false)} 
          onUploadSuccess={() => {
            setIsModalOpen(false);
            window.location.reload(); // 上傳成功後自動刷新頁面，分數與最新照片秒更新！
          }} 
        />
      )}
    </>
  );
}