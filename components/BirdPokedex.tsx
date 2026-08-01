'use client';

import { useState, useEffect } from 'react';
import type { Bird } from '@/types/bird';
import BirdCard from './BirdCard';

interface BirdPokedexProps {
  initialBirds: Bird[];
}

export default function BirdPokedex({ initialBirds = [] }: BirdPokedexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'rarity'>('rarity');
  
  // 【新增】分頁狀態：記住現在在第幾頁，預設第 1 頁
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24; // 每頁顯示 24 隻鳥

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

  // 【新增】當玩家搜尋或改變排序時，自動回到第 1 頁
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  // 【新增】計算分頁資料
  const totalPages = Math.ceil(sortedBirds.length / ITEMS_PER_PAGE);
  const currentBirds = sortedBirds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 【新增】換頁並自動捲動到最上面的小工具
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 換頁時平滑捲動到頂部
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
            onChange={(e) => setSortBy(e.target.value as 'id' | 'rarity')}
            className="w-full sm:w-48 cursor-pointer rounded-full border border-slate-200 bg-white px-6 py-4 text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          >
            <option value="id">依編號排序</option>
            <option value="rarity">常見度優先</option>
          </select>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          目前圖鑑共收錄 <span className="font-bold text-emerald-600">{sortedBirds.length}</span> 種鳥類
        </p>
      </div>

      {/* 【修改】這裡改成渲染 currentBirds (當前頁面的 24 隻鳥) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentBirds.map((bird) => (
          <BirdCard key={bird.編號} bird={bird} />
        ))}
      </div>

      {/* 【新增】底部分頁控制列 */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            上一頁
          </button>
          
          <span className="text-slate-600 font-medium">
            第 <span className="font-bold text-emerald-600">{currentPage}</span> / {totalPages} 頁
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
    </div>
  );
}