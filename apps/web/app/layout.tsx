import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "集采联盟 · 生鲜销售数据报表",
  description: "重庆集采联盟销售统计与轻量进销存系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
