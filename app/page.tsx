import { supabase } from '@/lib/supabase';
import type { Bird } from '@/types/bird';
import BirdPokedex from '@/components/BirdPokedex';
import Navbar from '@/components/Navbar';

export const revalidate = 0;

export default async function HomePage() {
  const { data: birds, error } = await supabase
    .from('birds')
    .select('*')
    .order('編號', { ascending: true });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-600">讀取資料失敗</h2>
          <p className="mt-2 text-slate-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const safeBirds = Array.isArray(birds) ? birds : [];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* 這裡放入我們剛剛做好的導覽列與登入按鈕 */}
      <Navbar />
      
      <BirdPokedex initialBirds={safeBirds as Bird[]} />
    </main>
  );
}