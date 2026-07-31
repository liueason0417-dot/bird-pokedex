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

  // 檢查這隻鳥有沒有被這個玩家拍過
  useEffect(() => {
    const checkPhoto = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;

      if (currentUser) {
        const { data } = await supabase
          .from('catch_records') // 注意：這裡已經改成我們新的資料表了！
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
    };
    checkPhoto();
  }, [bird.編號]);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg flex flex-col h-full">
      
      {/* 照片顯示區塊 (純展示) */}
      <div className="relative h-48 w-full bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
        {photoUrl ? (
          <img src={photoUrl} alt={bird.中文名} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="text-5xl opacity-20 grayscale filter">🦅</span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="relative flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">
              {bird.中文名}
            </h3>
            <p className="mt-1 truncate text-sm italic text-slate-500">
              {bird.英文名}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {bird.基礎分數} 分
            </span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${getMigrationStyle(bird.遷徙屬性)}`}>
            {bird.遷徙屬性 || '未知'}
          </span>
          <span className="text-xs text-slate-400">#{bird.編號}</span>
        </div>
      </div>
    </article>
  );
}