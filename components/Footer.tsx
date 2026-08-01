export default function Footer() {
    return (
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p className="mb-2 font-medium">
            🦅 台灣鳥類圖鑑 — 紀錄與探索台灣鳥類多樣性
          </p>
          <p className="text-xs text-slate-400">
            本站 703 種鳥類名錄資料引用自：
            <a 
              href="https://www.bird.org.tw/download/5698" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline font-bold ml-1"
            >
              中華民國野鳥學會《2026 年臺灣鳥類名錄》
            </a>
          </p>
        </div>
      </footer>
    );
  }