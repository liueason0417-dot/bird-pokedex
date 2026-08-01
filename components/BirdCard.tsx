'use client';

import { useState, useEffect } from 'react';
import type { Bird } from "@/types/bird";
import { supabase } from '@/lib/supabase';

function getMigrationStyle(type: string) {
  if (!type) return "bg-slate-100 text-slate-700 ring-slate-200";
  if (type.includes("留")) return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (type.includes("過")) return "bg-sky-100 text-sky-800 ring-sky-200";
  if (type.includes("冬")) return "bg-amber-100 text-amber-800 ring-amber-200";
  if (type.includes("夏")) return "bg-orange-100 text-orange-800 ring-orange-200";
  if (type.includes("迷")) return "bg-violet-100 text-violet-800 ring-violet-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

interface BirdCardProps {
  bird: Bird;
}

export default function BirdCard({ bird }: BirdCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 新增載入狀態，避免畫面閃爍

  // 檢查這隻鳥有沒有被這個玩家拍過
  useEffect(() => {
    const checkPhoto = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (currentUser) {
        const { data } = await supabase
          .from('catch_records')
          .select('photo_url')
          .eq('user_id', currentUser.id)
          .eq('bird_id', bird.編號)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (data) {
          setPhotoUrl(data.photo_url);
        }
      }
      setIsLoading(false);
    };
    checkPhoto();
  }, [bird.編號]);

  // 判斷是否已解鎖
  const isUnlocked = !!photoUrl;

  return (
    <article 
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col h-full
        ${isUnlocked 
          ? 'border-2 border-emerald-400 bg-white shadow-md hover:-translate-y-1 hover:shadow-xl' // 已解鎖：綠色粗框、亮白色、浮起陰影
          : 'border border-slate-200 bg-slate-50 shadow-sm hover:-translate-y-1 hover:shadow-md grayscale-[40%]' // 未解鎖：灰色底、稍微灰階
        }
      `}
    >
      {/* 照片顯示區塊 */}
      <div className="relative h-48 w-full bg-slate-200 flex items-center justify-center overflow-hidden border-b border-slate-100">
        
        {/* 狀態標籤 (右上角) */}
        {!isLoading && (
          <div className="absolute top-3 right-3 z-10">
            {isUnlocked ? (
              <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                ✅ 已解鎖
              </span>
            ) : (
              <span className="bg-slate-500/80 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                🔒 未解鎖
              </span>
            )}
          </div>
        )}

        {/* 圖片或佔位符 */}
        {isUnlocked ? (
          <img 
            src={photoUrl} 
            alt={bird.中文名} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center opacity-30">
            <span className="text-6xl filter grayscale mb-2">🦅</span>
            <span className="text-sm font-bold text-slate-600 tracking-widest">UNKNOWN</span>
          </div>
        )}
      </div>

      {/* 文字資訊區塊 */}
      <div className={`p-5 flex flex-col flex-grow ${isUnlocked ? 'opacity-100' : 'opacity-70'}`}>
        <div className="relative flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className={`truncate text-lg font-bold tracking-tight ${isUnlocked ? 'text-emerald-900' : 'text-slate-700'}`}>
              {bird.中文名}
            </h3>
            <p className="mt-1 truncate text-sm italic text-slate-500">
              {bird.英文名}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm
              ${isUnlocked ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-400'}
            `}>
              {bird.基礎分數} 分
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getMigrationStyle(bird.遷徙屬性)}`}>
            {bird.遷徙屬性 || '未知'}
          </span>
          <span className="text-xs text-slate-400 font-bold">#{bird.編號}</span>
        </div>
      </div>
    </article>
  );
}