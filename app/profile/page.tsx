'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import type { Bird } from '@/types/bird';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      // 抓取玩家的所有紀錄
      const { data: recordsData } = await supabase
        .from('catch_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      // 抓取鳥類字典 (用來對照名字)
      const { data: birdsData } = await supabase.from('birds').select('*');

      if (recordsData) setRecords(recordsData);
      if (birdsData) setBirds(birdsData as Bird[]);
      
      setLoading(false);
    };

    fetchProfileData();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">載入中...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center pt-32 text-slate-500 text-lg font-bold">請先登入才能查看背包喔！</div>
      </div>
    );
  }

  // 計算數據
  const totalScore = records.reduce((sum, record) => sum + (record.score_earned || 0), 0);
  const uniqueBirds = new Set(records.map(r => r.bird_id)).size;
  
  // 【新增】計算圖鑑完成度百分比 (最高 100%)
  const TOTAL_BIRDS = 703;
  const progressPercentage = Math.min(100, Math.round((uniqueBirds / TOTAL_BIRDS) * 100));

  // 【新增】動態稱號系統 (根據解鎖數量決定稱號)
  let playerTitle = "新手鳥友 🌱";
  if (uniqueBirds >= 10) playerTitle = "業餘觀察家 🔭";
  if (uniqueBirds >= 50) playerTitle = "資深鳥人 🦅";
  if (uniqueBirds >= 150) playerTitle = "生態大師 👑";
  if (uniqueBirds >= 300) playerTitle = "圖鑑守護者 🌟";

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
            <div className="text-center sm:text-left">
              <h2 className="text-3xl font-black text-slate-800 mb-1">{user.user_metadata?.full_name || '鳥友'}</h2>
              {/* 【修改】顯示動態稱號 */}
              <p className="text-emerald-600 font-bold text-lg">{playerTitle}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* 總積分區塊 */}
            <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100/50 flex flex-col justify-center">
              <div className="text-sm text-emerald-600 font-bold mb-2">總積分</div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-700">{totalScore}</div>
            </div>
            
            {/* 解鎖進度區塊 */}
            <div className="bg-sky-50 rounded-2xl p-6 text-center border border-sky-100/50">
              <div className="text-sm text-sky-600 font-bold mb-2">已解鎖圖鑑</div>
              <div className="text-4xl sm:text-5xl font-black text-sky-700 mb-4">
                {uniqueBirds} <span className="text-xl sm:text-2xl text-sky-400 font-bold">/ {TOTAL_BIRDS}</span>
              </div>
              
              {/* 【新增】超帥的進度條 */}
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
              <div key={record.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
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
}