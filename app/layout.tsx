import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import HeaderControls from '@/components/HeaderControls';
import { headers } from 'next/headers';
import ContextProvider from './context';
import { Suspense } from 'react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Catcents NFT App',
  description: 'NFT Dashboard with Discord authentication',
};

async function getUser() {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/user`;
    console.log('Fetching user from:', url);
    const res = await fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('User API response status:', res.status);
    if (!res.ok) {
      console.log('User API failed:', res.statusText);
      return null;
    }
    const data: { userId: string | null } = await res.json();
    console.log('User API response data:', data);
    return data.userId ? { id: data.userId } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

const externalLinks = {
  playground: process.env.NEXT_PUBLIC_PLAYGROUND_URL || 'https://www.catcents.io/dashboard',
  deets: process.env.NEXT_PUBLIC_DEETS_URL || 'https://deets.catcents.io/',
  x: 'https://x.com/catcentsio',
  discord: 'https://discord.com/invite/TXPbt7ztMC',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  console.log('User in layout:', user);
  const cookies = (await headers()).get('cookie');

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-[var(--background)]`}
      >
        <ContextProvider cookies={cookies}>
          <header className="bg-gradient-to-r from-[var(--background)] to-[var(--accent)] p-3 sm:p-4 shadow-lg sticky top-0 z-50">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <Image
                  src="/cat-logo.png"
                  alt="Catcents Logo"
                  width={40}
                  height={40}
                  className="rounded-full animate-glow sm:w-12 sm:h-12"
                  priority
                />
              </Link>
              <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
                <Link
                  href={externalLinks.playground}
                  className="text-base sm:text-lg text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors duration-300"
                >
                  Playground
                </Link>
                <Link
                  href={externalLinks.deets}
                  className="text-base sm:text-lg text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors duration-300"
                >
                  Deets
                </Link>
                
                <Suspense fallback={<div className="animate-pulse h-8 w-40 bg-[var(--border)] rounded-full" />}>
                  <HeaderControls user={user} />
                </Suspense>
              </nav>
            </div>
          </header>
          <Suspense fallback={<div className="flex-grow flex items-center justify-center">Loading...</div>}>
            <main className="max-w-6xl mx-auto p-4 sm:p-6 flex-grow flex flex-col">
              {children}
            </main>
          </Suspense>
          <Footer />
        </ContextProvider>
      </body>
    </html>
  );
}