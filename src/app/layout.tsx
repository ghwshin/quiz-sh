import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "quiz.sh",
  description: "개발자를 위한 CS 학습 퀴즈",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
