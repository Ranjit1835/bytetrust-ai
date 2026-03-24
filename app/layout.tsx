import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ByteTrust AI — Execution-Aware Coding',
  description:
    'ByteTrust generates, simulates, and scores your Python code — so you ship with confidence, not hope.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bytetrust-dark font-body text-slate-200 grid-bg">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 border-b border-bytetrust-border/60 bg-bytetrust-dark/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl text-bytetrust-cyan group-hover:text-glow-cyan transition-all">⬡</span>
              <span className="text-lg font-heading font-bold text-white tracking-tight">
                ByteTrust
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                History
              </Link>
              <Link
                href="/dashboard"
                className="text-sm px-4 py-1.5 rounded-lg border border-bytetrust-cyan/40 text-bytetrust-cyan hover:bg-bytetrust-cyan/10 transition-all font-medium"
              >
                New Analysis
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main>{children}</main>
      </body>
    </html>
  );
}
