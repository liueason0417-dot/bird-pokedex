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

  // 編輯狀態
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(''); // 儲存選擇的頭像
  const [isSavingName, setIsSavingName] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }
      setUser(session.user);
      
      // 預設填入目前的暱稱和頭像
      setNewName(session.user.user_metadata?.custom_name || session.user.user_metadata?.full_name || '');
      setNewAvatar(session.user.user_metadata?.custom_avatar || session.user.user_metadata?.avatar_url || '');

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

  const handleSaveProfile = async () => {
    if (!newName.trim()) return;
    setIsSavingName(true);
    
    try {
      // 同時儲存自訂暱稱與自訂頭像
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          custom_name: newName.trim(),
          custom_avatar: newAvatar
        }
      });

      if (error) throw error;
      
      setUser(data.user);
      setIsEditingName(false);
      alert('✅ 個人檔案修改成功！');
    } catch (error) {
      console.error('更新失敗:', error);
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
      alert('🗑️ 紀錄已成功刪除！');
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

  // 決定畫面上要顯示的資料
  const displayName = user.user_metadata?.custom_name || user.user_metadata?.full_name || '神秘鳥友';
  const displayAvatar = user.user_metadata?.custom_avatar || user.user_metadata?.avatar_url;

  // 【修改】刪除多餘的 avatar3，只保留你真正擁有的圖片，並自動過濾重複
  const avatarOptions = Array.from(new Set([
    user.user_metadata?.avatar_url, // 選項 1: Google 頭像
    '/avatar1.png',                 // 選項 2: 自訂頭像 1
    '/avatar2.png',                 // 選項 3: 自訂頭像 2
  ].filter(Boolean))); 

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-10 mb-8 border border-slate-100">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            
            {/* 頭像顯示區塊 */}
            {displayAvatar ? (
              <img src={displayAvatar} className="w-24 h-24 rounded-full border-4 border-emerald-50 shadow-sm object-cover bg-slate-100" alt="大頭貼" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">👤</div>
            )}
            
            <div className="text-center sm:text-left flex-1">
              {isEditingName ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block">
                  <p className="text-xs font-bold text-slate-500 mb-2 text-left">選擇你的頭像：</p>
                  
                  {/* 頭像選擇器 */}
                  <div className="flex justify-center sm:justify-start gap-3 mb-4 flex-wrap">
                    {avatarOptions.map((avatarUrl, idx) => (
                      <img 
                        key={idx}
                        src={avatarUrl as string} 
                        onClick={() => setNewAvatar(avatarUrl as string)}
                        className={`w-12 h-12 rounded-full cursor-pointer border-2 object-cover bg-white transition-all ${
                          newAvatar === avatarUrl ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                        alt={`頭像選項 ${idx}`}
                      />
                    ))}
                  </div>

                  <p className="text-xs font-bold text-slate-500 mb-2 text-left">你的暱稱：</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <input 
                      type="text" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="輸入新暱稱"
                      className="px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-bold w-40 sm:w-auto"
                      maxLength={15}
                    />
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSavingName}
                      className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {isSavingName ? '儲存中' : '儲存'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingName(false);
                        setNewAvatar(displayAvatar); // 取消時恢復原本頭像
                      }}
                      className="bg-slate-200 text-slate-600 px-4 py-1.5 rounded-lg font-bold hover:bg-slate-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                  <h2 className="text-3xl font-black text-slate-800">{displayName}</h2>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    className="text-slate-400 hover:text-emerald-600 transition-colors"
                    title="修改個人檔案"
                  >
                    ✏️
                  </button>
                </div>
              )}
              
              {!isEditingName && <p className="text-emerald-600 font-bold text-lg">{playerTitle}</p>}
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

        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          📸 我的賞鳥紀錄
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => {
            const birdInfo = birds.find(b => b.編號 === record.bird_id);
            return (
              <div 
                key={record.id} 
                onClick={() => setSelectedRecord(record)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all relative group cursor-pointer hover:-translate-y-1"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleDelete(record.id);
                  }}
                  className="absolute top-3 right-3 z-10 bg-red-500/80 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-colors opacity-80 hover:opacity-100"
                  title="刪除這筆紀錄"
                >
                  🗑️
                </button>
                
                <div className="h-56 overflow-hidden bg-slate-100 relative">
                  <img src={record.photo_url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt="鳥類照片" />
                  {record.is_first_catch && (
                    <div className="absolute top-3 left-3 bg-amber-400 text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                      ✨ 首次紀錄
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
            <p className="text-lg text-slate-500 font-medium">背包空空的，快去戶外賞鳥吧！</p>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all"
          onClick={() => setSelectedRecord(null)} 
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} 
          >
            <button 
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold z-10 transition-colors shadow-md"
            >
              ✕
            </button>

            <div className="bg-slate-950 flex items-center justify-center overflow-hidden flex-1 min-h-[300px]">
              <img 
                src={selectedRecord.photo_url} 
                alt="鳥類大圖" 
                className="max-h-[65vh] w-auto object-contain mx-auto"
              />
            </div>

            <div className="p-6 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-100">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-black text-slate-800">
                    {birds.find(b => b.編號 === selectedRecord.bird_id)?.中文名 || '未知鳥類'}
                  </h3>
                  {selectedRecord.is_first_catch && (
                    <span className="bg-amber-400 text-white text-xs font-black px-2.5 py-1 rounded-full">
                      ✨ 首次紀錄
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 italic">
                  {birds.find(b => b.編號 === selectedRecord.bird_id)?.英文名 || ''}
                </p>
              </div>

              <div className="text-center sm:text-right">
                <div className="text-emerald-600 font-black text-xl mb-1">
                  +{selectedRecord.score_earned} 分
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  觀察日期：{new Date(selectedRecord.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}