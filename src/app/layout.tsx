import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Easy Japanese Reading",
  description:
    "A modern web app for reading Japanese kanji with furigana, translation, audio, and flashcards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-50 to-blue-100 min-h-screen`}
      >
        <div className="min-h-screen flex flex-col items-center justify-center px-0 w-full">
          <main className="w-full max-w-4xl bg-white/80 shadow-xl rounded-2xl p-8 mt-10 mb-10 border border-gray-200">
            {children}
          </main>
          <footer className="text-xs text-gray-400 mt-4 mb-2">
            © 2025 Japanese Learning App
          </footer>
        </div>
      </body>
    </html>
  );
}
