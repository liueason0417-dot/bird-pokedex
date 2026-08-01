'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bird } from '@/types/bird';
import imageCompression from 'browser-image-compression';

interface UploadModalProps {
  user: any;
  birds: Bird[];
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadModal({ user, birds, onClose, onUploadSuccess }: UploadModalProps) {
  const [selectedBirdId, setSelectedBirdId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 記錄拍攝日期，預設為今天 (格式: YYYY-MM-DD)
  const [catchDate, setCatchDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 篩選鳥類下拉選單
  const filteredBirds = birds.filter(b => 
    b.中文名.includes(searchQuery) || b.英文名.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10); // 只顯示前10筆避免卡頓

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedBirdId || !user) return;

    try {
      setIsUploading(true);
      const targetBird = birds.find(b => b.編號 === Number(selectedBirdId));
      if (!targetBird) throw new Error('找不到鳥類資料');

      // 1. 壓縮圖片
      const compressedFile = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1080 });

      // 2. 上傳 Cloudinary
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST', body: formData
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error('圖床上傳失敗');

      // 3. 檢查是否為首次紀錄
      const { data: existingRecords } = await supabase
        .from('catch_records')
        .select('id')
        .eq('user_id', user.id)
        .eq('bird_id', targetBird.編號);
      
      const isFirstCatch = !existingRecords || existingRecords.length === 0;
      
      // 【修改】算出這隻鳥的「首次分數」
      let baseFirstScore = targetBird.基礎分數 || 10;
      if (targetBird.遷徙屬性?.includes('引進種')) {
        baseFirstScore = 2; // 引進種首次拿 2 分
      }

      // 【修改】公平比例計分邏輯！
      let scoreEarned = 1;
      if (isFirstCatch) {
        scoreEarned = baseFirstScore; // 首次紀錄：拿全額分數
      } else {
        // 再次紀錄：拿首次分數的 20% (保底最少 1 分)
        scoreEarned = Math.max(1, Math.floor(baseFirstScore * 0.2));
      }

      // 處理時區問題，確保存入資料庫的日期是正確的
      const saveDate = new Date(catchDate);
      saveDate.setHours(12, 0, 0, 0); // 設定為中午，避免時區轉換時變成前一天

      // 4. 寫入資料庫
      const { error } = await supabase.from('catch_records').insert([{
        user_id: user.id,
        bird_id: targetBird.編號,
        photo_url: data.secure_url,
        is_first_catch: isFirstCatch,
        score_earned: scoreEarned,
        created_at: saveDate.toISOString() // 覆蓋預設時間，改用玩家選擇的日期
      }]);

      if (error) throw error;

      // 【修改】使用專業賞鳥用語「首次解鎖紀錄 / 再次觀察紀錄」
      alert(`🎉 成功紀錄！${isFirstCatch ? '首次解鎖紀錄！' : '再次觀察紀錄！'} 獲得 ${scoreEarned} 分！`);
      onUploadSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      alert('上傳失敗，請稍後再試');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">📸 新增賞鳥紀錄</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>

        {/* 選擇照片 */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-emerald-400 transition-colors mb-6 overflow-hidden relative shrink-0"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center text-slate-500">
              <span className="text-3xl block mb-2">📷</span>
              <p className="font-medium">點擊選擇照片</p>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
        </div>

        {/* 搜尋與選擇鳥類 */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-2">這是什麼鳥？</label>
          <input 
            type="text" 
            placeholder="輸入關鍵字搜尋 (例如: 黑冠)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 mb-2 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
          />
          <select 
            value={selectedBirdId} 
            onChange={(e) => setSelectedBirdId(Number(e.target.value))}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900"
          >
            <option value="">-- 請選擇鳥類 --</option>
            {filteredBirds.map(b => {
              // 【修改】下拉選單清晰展示：首次可拿幾分 / 再次可拿幾分
              const firstScore = b.遷徙屬性?.includes('引進種') ? 2 : (b.基礎分數 || 10);
              const repeatScore = Math.max(1, Math.floor(firstScore * 0.2));
              return (
                <option key={b.編號} value={b.編號}>
                  {b.中文名} (首次: {firstScore}分 / 再次: {repeatScore}分)
                </option>
              );
            })}
          </select>
        </div>

        {/* 拍攝日期選擇器 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">拍攝日期</label>
          <input 
            type="date" 
            value={catchDate}
            max={new Date().toISOString().split('T')[0]} 
            onChange={(e) => setCatchDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 cursor-pointer"
          />
        </div>

        {/* 送出按鈕 */}
        <button 
          onClick={handleUpload}
          disabled={!file || !selectedBirdId || isUploading}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? '⏳ 壓縮上傳中...' : '🚀 送出紀錄'}
        </button>
      </div>
    </div>
  );
}