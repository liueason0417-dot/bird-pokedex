'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Bird } from '@/types/bird';
import BirdPokedex from '@/components/BirdPokedex';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 抓取鳥類資料
  const fetchData = async () => {
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
    </main>
  );
}