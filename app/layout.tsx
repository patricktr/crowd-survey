import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "CrowdSurvey",
  description:
    "Share a link, collect questions, see who agrees. Lightweight and not anonymous.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              CrowdSurvey
            </Link>
            <nav className="text-sm flex gap-4">
              <Link
                href="/admin"
                className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
              >
                Your boards
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="text-xs text-black/40 dark:text-white/40 py-6 text-center">
          Not anonymous. Names required. No accounts.
        </footer>
      </body>
    </html>
  );
}
