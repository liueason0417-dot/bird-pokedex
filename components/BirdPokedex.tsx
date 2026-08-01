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
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24; // 每頁 24 隻鳥

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
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 換頁自動回到頂部
  };

  // 【新增】智慧頁碼演算法：生成像是 [1, '...', 4, 5, 6, '...', 30] 的簡潔按鈕
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 搜尋與排序 */}
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

      {/* 鳥類網格卡片 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentBirds.map((bird) => (
          <BirdCard key={bird.編號} bird={bird} />
        ))}
      </div>

      {/* 【全新質感膠囊分頁列】 */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* 上一頁按鈕 */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            上一頁
          </button>

          {/* 頁碼膠囊按鈕群 */}
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
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-md scale-105' // 當前頁面：發光翡翠綠
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200' // 其他頁面：乾淨白膠囊
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* 下一頁按鈕 */}
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
    </div>
  );
}