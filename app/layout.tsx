import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 【新增】設定手機版的畫面行為 (沒有網址列、設定頂部狀態列顏色)
export const viewport: Viewport = {
  themeColor: "#10b981", // 這是 Tailwind 的 emerald-500 綠色
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 防止玩家連點螢幕時不小心放大畫面，這樣更像原生 App
};

// 【修改】加上 PWA 需要的設定，並保留你原本的 title 和 description
export const metadata: Metadata = {
  title: "台灣鳥類圖鑑",
  description: "探索台灣 703 種鳥類的中文名、英文名、遷徙屬性與基礎分數。",
  manifest: "/manifest.json", // 指向我們剛剛建立的身分證
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "台灣鳥類圖鑑",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}