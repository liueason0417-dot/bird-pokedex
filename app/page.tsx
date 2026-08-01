'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bird } from '@/types/bird';
import BirdPokedex from '@/components/BirdPokedex';
import Navbar from '@/components/Navbar';
import UploadModal from '@/components/UploadModal';

export default function HomePage() {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 抓取鳥類資料與登入狀態
  const fetchData = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    setUser(sessionData.session?.user ?? null);

    const { data: birdsData, error: birdsError } = await supabase
      .from('birds')
      .select('*')
      .order('編號', { ascending: true });

    if (birdsError) {
      setError(birdsError.message);
    } else {
      setBirds(birdsData as Bird[]);
    }
  };

  useEffect(() => {
    fetchData();

    // 監聽 Navbar 傳來的打開視窗事件
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener('open-upload-modal', handleOpenModal);
    
    return () => window.removeEventListener('open-upload-modal', handleOpenModal);
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600">讀取資料失敗</h2>
          <p className="mt-2 text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      <BirdPokedex initialBirds={birds} />

      {/* 上傳視窗 (隱藏狀態，點擊按鈕才顯示) */}
      {isModalOpen && user && (
        <UploadModal 
          user={user} 
          birds={birds} 
          onClose={() => setIs'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import type { Bird } from '@/types/bird';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);

  // 【新增】修改暱稱的狀態
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);
      // 預設把輸入框填入目前的暱稱或名字
      setNewName(session.user.user_metadata?.custom_name || session.user.user_metadata?.full_name || '');

      const { data: recordsData } = await supabase
        .from('catch_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const { data: birdsData } = await supabase.from('birds').select('*');

      if (recordsData) setRecords(recordsData);
      if (birdsData) setBirds(birdsData as Bird[]);
      
      setLoading(false);
    };

    fetchProfileData();
  }, []);

  // 【新增】儲存新暱稱的函數
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    
    try {
      // 更新 Supabase 裡的 user_metadata
      const { data, error } = await supabase.auth.updateUser({
        data: { custom_name: newName.trim() }
      });

      if (error) throw error;
      
      // 更新成功後，把畫面上的 user 狀態也更新
      setUser(data.user);
      setIsEditingName(false);
      alert('✅ 暱稱修改成功！排行榜將會顯示你的新名字。');
    } catch (error) {
      console.error('更新名字失敗:', error);
      alert('修改失敗，請稍後再試');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    const isConfirmed = window.confirm('確定要刪除這筆紀錄嗎？刪除後分數會自動扣除喔！');
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from('catch_records').delete().eq('id', recordId);
      if (error) throw error;
      setRecords(prevRecords => prevRecords.filter(record => record.id !== recordId));
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗，請稍後再試');
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">載入中...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center pt-32 text-slate-500 text-lg font-bold">請先登入才能查看背包喔！</div>
      </div>
    );
  }

  const totalScore = records.reduce((sum, record) => sum + (record.score_earned || 0), 0);
  const uniqueBirds = new Set(records.map(r => r.bird_id)).size;
  const TOTAL_BIRDS = 703;
  const progressPercentage = Math.min(100, Math.round((uniqueBirds / TOTAL_BIRDS) * 100));

  let playerTitle = "新手鳥友 🌱";
  if (uniqueBirds >= 10) playerTitle = "業餘觀察家 🔭";
  if (uniqueBirds >= 50) playerTitle = "資深鳥人 🦅";
  if (uniqueBirds >= 150) playerTitle = "生態大師 👑";
  if (uniqueBirds >= 300) playerTitle = "圖鑑守護者 🌟";

  // 【新增】決定畫面上要顯示什麼名字 (優先顯示自訂暱稱)
  const displayName = user.user_metadata?.custom_name || user.user_metadata?.full_name || '神秘鳥友';

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 玩家名片 */}
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10 mb-8 border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            {user.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} className="w-24 h-24 rounded-full border-4 border-emerald-50 shadow-sm" alt="大頭貼" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">👤</div>
            )}
            
            <div className="text-center sm:text-left flex-1">
              {/* 【修改】暱稱編輯區塊 */}
              {isEditingName ? (
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="輸入新暱稱 (可匿名)"
                    className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-bold"
                    maxLength={15}
                  />
                  <button 
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {isSavingName ? '儲存中' : '儲存'}
                  </button>
                  <button 
                    onClick={() => setIsEditingName(false)}
                    className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-300"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                  <h2 className="text-3xl font-black text-slate-800">{displayName}</h2>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-emerald-600 transition-colors"
                    title="修改暱稱"
                  >
                    ✏️
                  </button>
                </div>
              )}
              
              <p className="text-emerald-600 font-bold text-lg">{playerTitle}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100/50 flex flex-col justify-center">
              <div className="text-sm text-emerald-600 font-bold mb-2">總積分</div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-700">{totalScore}</div>
            </div>
            
            <div className="bg-sky-50 rounded-2xl p-6 text-center border border-sky-100/50">
              <div className="text-sm text-sky-600 font-bold mb-2">已解鎖圖鑑</div>
              <div className="text-4xl sm:text-5xl font-black text-sky-700 mb-4">
                {uniqueBirds} <span className="text-xl sm:text-2xl text-sky-400 font-bold">/ {TOTAL_BIRDS}</span>
              </div>
              
              <div className="w-full bg-sky-200/50 rounded-full h-3 mb-1 overflow-hidden">
                <div 
                  className="bg-sky-500 h-3 rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-right text-xs text-sky-500 font-bold">
                完成度 {progressPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* 照片動態牆 */}
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          📸 我的抓寶紀錄
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => {
            const birdInfo = birds.find(b => b.編號 === record.bird_id);
            return (
              <div key={record.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                <button
                  onClick={() => handleDelete(record.id)}
                  className="absolute top-3 right-3 z-10 bg-red-500/80 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors opacity-80 hover:opacity-100"
                  title="刪除這筆紀錄"
                >
                  🗑️
                </button>
                <div className="h-56 overflow-hidden bg-slate-100 relative">
                  <img src={record.photo_url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="鳥類照片" />
                  {record.is_first_catch && (
                    <div className="absolute top-3 left-3 bg-amber-400 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                      ✨ 首抓
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-slate-800">{birdInfo?.中文名 || '未知鳥類'}</h4>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      +{record.score_earned} 分
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {new Date(record.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {records.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
            <span className="text-6xl block mb-4 opacity-50">🦅</span>
            <p className="text-lg text-slate-500 font-medium">背包空空的，快去戶外抓寶吧！</p>
          </div>
        )}
      </div>
    </main>
  );
}ModalOpen(false)} 
          onUploadSuccess={fetchData} // 上傳成功後重新抓取資料
        />
      )}
    </main>
  );
}