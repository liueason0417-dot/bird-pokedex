'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

// 定義排行榜資料的型別
interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url: string;
  total_score: number;
  unique_birds: number;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // 呼叫我們剛剛在 Supabase 寫好的後端小程式
      const { data, error } = await supabase.rpc('get_leaderboard');
      
      if (error) {
        console.error('讀取排行榜失敗:', error);
      } else {
        setLeaders(data || []);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 mb-4 flex items-center justify-center gap-3">
            🏆 全台鳥友排行榜
          </h1>
          <p className="text-slate-500 font-medium">看看誰是真正的台灣鳥類生態大師！</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold">計算積分中... ⏳</div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {leaders.length === 0 ? (
              <div className="text-center py-16 text-slate-500">目前還沒有人上榜，快去搶頭香！</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaders.map((player, index) => {
                  // 前三名給予特殊樣式
                  const isTop3 = index < 3;
                  const medals = ['🥇', '🥈', '🥉'];
                  
                  return (
                    <div 
                      key={player.user_id} 
                      className={`flex items-center p-4 sm:p-6 transition-colors hover:bg-slate-50
                        ${index === 0 ? 'bg-amber-50/30' : ''}
                      `}
                    >
                      {/* 名次 */}
                      <div className="w-12 sm:w-16 text-center shrink-0">
                        {isTop3 ? (
                          <span className="text-3xl sm:text-4xl">{medals[index]}</span>
                        ) : (
                          <span className="text-xl sm:text-2xl font-black text-slate-300">#{index + 1}</span>
                        )}
                      </div>

                      {/* 頭像與名字 */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt={player.user_name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-sm shrink-0" />
                        ) : (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl shrink-0">👤</div>
                        )}
                        <div className="truncate">
                          <h3 className={`font-bold truncate ${isTop3 ? 'text-lg sm:text-xl text-slate-800' : 'text-base sm:text-lg text-slate-700'}`}>
                            {player.user_name || '神秘鳥友'}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            已解鎖 {player.unique_birds} 種鳥類
                          </p>
                        </div>
                      </div>

                      {/* 積分 */}
                      <div className="text-right shrink-0 pl-4">
                        <div className={`font-black ${isTop3 ? 'text-2xl sm:text-3xl text-emerald-600' : 'text-xl sm:text-2xl text-slate-600'}`}>
                          {player.total_score}
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">
                          Points
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}