'use client';

import { useState, useEffect } from 'react';
import type { Bird } from '@/types/bird';
import BirdCard from './BirdCard';
import { supabase } from '@/lib/supabase';

interface BirdPokedexProps {
  initialBirds: Bird[];
}

export default function BirdPokedex({ initialBirds = [] }: BirdPokedexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'rarity' | 'unlocked'>('rarity');
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24; 

  const [unlockedBirdIds, setUnlockedBirdIds] = useState<Set<number>>(new Set());
  
  // 【新增】用來儲存玩家所有抓寶紀錄的詳細資料 (為了顯示大圖用)
  const [userRecords, setUserRecords] = useState<any[]>([]);
  // 【新增】控制大圖視窗的狀態
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  useEffect(() => {
    const fetchUnlockedBirds = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('catch_records')
          .select('*') // 【修改】把整筆紀錄都抓下來，不只抓 bird_id
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false }); // 照時間排，確保抓到最新的一張
        
        if (data) {
          setUserRecords(data);
          const ids = new Set(data.map(r => r.bird_id));
          setUnlockedBirdIds(ids);
        }
      }
    };
    fetchUnlockedBirds();
  }, []);

  const safeBirds = Array.isArray(initialBirds) ? initialBirds : [];

  const filteredBirds = safeBirds.filter((bird) => {
    const query = searchQuery.toLowerCase();
    const zhName = bird?.中文名 || '';
    const enName = bird?.英文名 || '';
    return (
      zhName.toLowerCase().includes(query) ||
      enName.toLowerCase().includes(query)
    );
  });

  const getStatusWeight = (status: string) => {
    if (!status || status.includes('歷史紀錄') || status.includes('無') || status.includes('?')) {
      return 99; 
    }
    let weight = 50; 
    if (status.includes('引進種') || status.includes('留')) weight = 10; 
    else if (status.includes('冬') || status.includes('夏')) weight = 20; 
    else if (status.includes('過')) weight = 30; 
    else if (status.includes('海')) weight = 40; 
    else if (status.includes('迷')) weight = 50; 

    if (status.includes('普') && !status.includes('不普')) weight -= 2; 
    if (status.includes('稀')) weight += 2; 
    return weight;
  };

  const sortedBirds = [...filteredBirds].sort((a, b) => {
    if (sortBy === 'unlocked') {
      const aUnlocked = unlockedBirdIds.has(a.編號) ? 1 : 0;
      const bUnlocked = unlockedBirdIds.has(b.編號) ? 1 : 0;
      
      if (aUnlocked !== bUnlocked) {
        return bUnlocked - aUnlocked; 
      }
      
      const scoreA = a.基礎分數 ? Number(a.基礎分數) : 999;
      const scoreB = b.基礎分數 ? Number(b.基礎分數) : 999;
      if (scoreA !== scoreB) return scoreA - scoreB;
      
      const weightA = getStatusWeight(a.遷徙屬性 || '');
      const weightB = getStatusWeight(b.遷徙屬性 || '');
      if (weightA !== weightB) return weightA - weightB;
      
      return (a.編號 || 0) - (b.編號 || 0);
    }

    if (sortBy === 'rarity') {
      const scoreA = a.基礎分數 ? Number(a.基礎分數) : 999;
      const scoreB = b.基礎分數 ? Number(b.基礎分數) : 999;
      if (scoreA !== scoreB) return scoreA - scoreB;
      
      const weightA = getStatusWeight(a.遷徙屬性 || '');
      const weightB = getStatusWeight(b.遷徙屬性 || '');
      if (weightA !== weightB) return weightA - weightB;
      
      return (a.編號 || 0) - (b.編號 || 0);
    }
    
    return (a.編號 || 0) - (b.編號 || 0);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const totalPages = Math.ceil(sortedBirds.length / ITEMS_PER_PAGE);
  const currentBirds = sortedBirds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // 【新增】處理點擊卡片的邏輯
  const handleCardClick = (birdId: number) => {
    // 找找看這隻鳥有沒有在玩家的紀錄裡 (找最新的一筆)
    const record = userRecords.find(r => r.bird_id === birdId);
    if (record) {
      setSelectedRecord(record); // 如果有紀錄，就打開大圖視窗
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto mb-12 max-w-2xl">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜尋鳥類中文或英文名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'id' | 'rarity' | 'unlocked')}
            className="w-full sm:w-48 cursor-pointer rounded-full border border-slate-200 bg-white px-6 py-4 text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="rarity">常見度優先</option>
            <option value="unlocked">已解鎖優先 ✨</option>
            <option value="id">依編號排序</option>
          </select>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          目前圖鑑共收錄 <span className="font-bold text-emerald-600">{sortedBirds.length}</span> 種鳥類
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentBirds.map((bird) => (
          // 【修改】在卡片外層包一個 div 來監聽點擊事件
          <div 
            key={bird.編號} 
            onClick={() => handleCardClick(bird.編號)}
            className={unlockedBirdIds.has(bird.編號) ? "cursor-pointer" : ""}
          >
            <BirdCard bird={bird} />
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            上一頁
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 py-2 text-slate-400 font-bold text-sm select-none">
                  •••
                </span>
              );
            }
            const pageNum = page as number;
            const isActive = pageNum === currentPage;
            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => handlePageChange(pageNum)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-md scale-105' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' 
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            下一頁
          </button>
        </div>
      )}

      {sortedBirds.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg text-slate-500">目前沒有顯示任何鳥類 🦅</p>
        </div>
      )}

      {/* 【新增】照片大圖檢視視窗 (Lightbox Modal) */}
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
                    {safeBirds.find(b => b.編號 === selectedRecord.bird_id)?.中文名 || '未知鳥類'}
                  </h3>
                  {selectedRecord.is_first_catch && (
                    <span className="bg-amber-400 text-white text-xs font-black px-2.5 py-1 rounded-full">
                      ✨ 首次紀錄
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 italic">
                  {safeBirds.find(b => b.編號 === selectedRecord.bird_id)?.英文名 || ''}
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
    </div>
  );
}