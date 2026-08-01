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
          onClose={() => setIsModalOpen(false)} 
          onUploadSuccess={fetchData} // 上傳成功後重新抓取資料
        />
      )}
    </main>
  );
}