import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameScope — Nghiên cứu thị trường game",
  description:
    "Khám phá thị trường game với báo cáo AI dựa trên nguồn web có thể kiểm chứng.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
