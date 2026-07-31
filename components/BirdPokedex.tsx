'use client';

import { useState } from 'react';
import type { Bird } from '@/types/bird';
import BirdCard from './BirdCard';

interface BirdPokedexProps {
  initialBirds: Bird[];
}

export default function BirdPokedex({ initialBirds = [] }: BirdPokedexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 【新增 1】記住玩家選擇的排序方式，預設為 'id' (編號)
  const [sortBy, setSortBy] = useState<'id' | 'rarity'>('id');

  // 安全防護：確保傳進來的絕對是一個清單（陣列）
  const safeBirds = Array.isArray(initialBirds) ? initialBirds : [];

  // 先過濾搜尋結果
  const filteredBirds = safeBirds.filter((bird) => {
    const query = searchQuery.toLowerCase();
    const zhName = bird?.中文名 || '';
    const enName = bird?.英文名 || '';
    return (
      zhName.toLowerCase().includes(query) ||
      enName.toLowerCase().includes(query)
    );
  });

  // 【新增 2】把過濾完的鳥類進行排序
  const sortedBirds = [...filteredBirds].sort((a, b) => {
    if (sortBy === 'rarity') {
      // 依常見度排序：基礎分數越低越前面 (加上 || 0 是為了防止資料庫有空值報錯)
      return (a.基礎分數 || 0) - (b.基礎分數 || 0);
    }
    // 預設依編號排序：編號越小越前面
    return (a.編號 || 0) - (b.編號 || 0);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 搜尋與排序列 */}
      <div className="mx-auto mb-12 max-w-2xl">
        
        {/* 【新增 3】使用 flex 讓搜尋框和下拉選單在電腦版並排，手機版上下排列 */}
        <div className="flex flex-col gap-4 sm:flex-row">
          
          {/* 原本的搜尋框 */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜尋鳥類中文或英文名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* 新增的下拉選單 (樣式與搜尋框保持一致) */}
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

      {/* 卡片網格 */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* 【修改】這裡原本是 filteredBirds.map，現在改成 sortedBirds.map */}
        {sortedBirds.map((bird) => (
          <BirdCard key={bird.編號} bird={bird} />
        ))}
      </div>

      {/* 找不到結果 */}
      {sortedBirds.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-lg text-slate-500">目前沒有顯示任何鳥類 🦅</p>
        </div>
      )}
    </div>
  );
}