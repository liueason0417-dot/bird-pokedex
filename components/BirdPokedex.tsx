'use client';

import { useState } from 'react';
import type { Bird } from '@/types/bird';
import BirdCard from './BirdCard';

interface BirdPokedexProps {
  initialBirds: Bird[];
}

export default function BirdPokedex({ initialBirds = [] }: BirdPokedexProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 【修改這裡】將預設值從 'id' 改成 'rarity'，這樣一進來就會是常見度優先！
  const [sortBy, setSortBy] = useState<'id' | 'rarity'>('rarity');

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

  // 把你的 CSV 簡寫轉換成「稀有度權重」(數字越小，排越前面)
  const getStatusWeight = (status: string) => {
    // 遇到沒資料、歷史紀錄、無、問號的鳥，全部給最高權重 (99分，踢到最後面)
    if (!status || status.includes('歷史紀錄') || status.includes('無') || status.includes('?')) {
      return 99; 
    }
    
    let weight = 50; // 預設中間值

    // 1. 先看是哪種鳥 (決定大方向)
    if (status.includes('引進種') || status.includes('留')) weight = 10; 
    else if (status.includes('冬') || status.includes('夏')) weight = 20; 
    else if (status.includes('過')) weight = 30; 
    else if (status.includes('海')) weight = 40; 
    else if (status.includes('迷')) weight = 50; 

    // 2. 再看普遍程度 (微調順序)
    if (status.includes('普') && !status.includes('不普')) weight -= 2; 
    if (status.includes('稀')) weight += 2; 

    return weight;
  };

  // 把過濾完的鳥類進行三階段排序
  const sortedBirds = [...filteredBirds].sort((a, b) => {
    if (sortBy === 'rarity') {
      
      // 如果資料庫分數是空的，就給牠 999 分 (最罕見)；否則使用原本的分數
      const scoreA = a.基礎分數 ? Number(a.基礎分數) : 999;
      const scoreB = b.基礎分數 ? Number(b.基礎分數) : 999;
      
      // 第一關：先比基礎分數 (分數低的在前面)
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      
      // 第二關：分數一樣的話，讓電腦看「遷徙屬性」自動排 (留鳥 > 候鳥 > 迷鳥)
      const weightA = getStatusWeight(a.遷徙屬性 || '');
      const weightB = getStatusWeight(b.遷徙屬性 || '');
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      
      // 第三關：如果連屬性都一模一樣，最後才照編號排
      return (a.編號 || 0) - (b.編號 || 0);
    }
    
    // 依編號排序：編號越小越前面
    return (a.編號 || 0) - (b.編號 || 0);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 搜尋與排序列 */}
      <div className="mx-auto mb-12 max-w-2xl">
        
        {/* 使用 flex 讓搜尋框和下拉選單在電腦版並排，手機版上下排列 */}
        <div className="flex flex-col gap-4 sm:flex-row">
          
          {/* 搜尋框 */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜尋鳥類中文或英文名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 text-slate-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* 排序下拉選單 */}
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