'use client';

import { useState, useRef, useEffect } from 'react';
import type { Bird } from "@/types/bird";
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';

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
  const [user, setUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 檢查登入狀態 & 抓取是否已經有照片
  useEffect(() => {
    const checkUserAndPhoto = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // 去資料庫找找看這個玩家有沒有拍過這隻鳥
        const { data } = await supabase
          .from('user_birds')
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
    checkUserAndPhoto();
  }, [bird.編號]);

  // 處理照片上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);

      // 1. 壓縮圖片 (限制 300KB，保護你的容量)
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1080,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, options);

      // 2. 上傳到 Cloudinary 圖床
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (!data.secure_url) throw new Error('上傳圖床失敗');
      const uploadedUrl = data.secure_url;

      // 3. 存入 Supabase 資料庫 (綁定玩家與鳥類)
      const { error } = await supabase
        .from('user_birds')
        .insert([
          {
            user_id: user.id,
            bird_id: bird.編號,
            photo_url: uploadedUrl
          }
        ]);

      if (error) throw error;

      // 4. 更新畫面
      setPhotoUrl(uploadedUrl);
      alert(`🎉 成功解鎖【${bird.中文名}】！獲得 ${bird.基礎分數} 分！`);

    } catch (error) {
      console.error(error);
      alert('上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // 清空選擇的檔案
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg flex flex-col h-full">
      
      {/* 照片顯示區塊 */}
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

        {/* 上傳按鈕區塊 (有登入才顯示) */}
        {user && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                photoUrl 
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:shadow-sm'
              }`}
            >
              {isUploading ? '⏳ 壓縮上傳中...' : photoUrl ? '📸 更新照片' : '📸 上傳照片解鎖'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}