import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Catcents Discord Auth App',
  description: 'Manage your Catcents roles and wallet with Discord authentication',
};

async function getUser() {
  try {
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/user`;
    console.log('Fetching user from:', url); // Debug log
    const res = await fetch(url, {
      credentials: 'include', // Ensure cookies are sent
      cache: 'no-store', // Prevent caching
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('User API response status:', res.status); // Debug log
    if (!res.ok) {
      console.log('User API failed:', res.statusText);
      return null;
    }
    const data: { userId: string | null } = await res.json();
    console.log('User API response data:', data); // Debug log
    return data.userId ? { id: data.userId } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  console.log('User in layout:', user); // Debug log

  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-[var(--background)]`}
      >
        <header className='bg-gradient-to-r from-[var(--background)] to-[var(--accent)] p-3 sm:p-4 shadow-lg sticky top-0 z-50'>
          <div className='max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0'>
            <Link href='/' className='flex items-center gap-2 sm:gap-3'>
              <Image
                src='/cat-logo.png'
                alt='Catcents Logo'
                width={40}
                height={40}
                className='rounded-full animate-glow sm:w-12 sm:h-12'
              />
            </Link>
            <nav className='flex flex-wrap items-center gap-2 sm:gap-4'>
              <Link
                href='https://www.catcents.io/dashboard'
                className='px-3 py-1 sm:px-4 sm:py-2 text-[var(--text)] font-semibold rounded-full bg-[var(--border)] hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base'
              >
                Playground
              </Link>
              <Link
                href='https://deets.catcents.io/'
                className='px-3 py-1 sm:px-4 sm:py-2 text-[var(--text)] font-semibold rounded-full bg-[var(--border)] hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base'
              >
                Deets
              </Link>
              <a
                href='https://x.com/catcentsio'
                target='_blank'
                rel='noopener noreferrer'
                className='p-1 sm:p-2 hover:scale-110 transition-transform'
                aria-label='Follow on X'
              >
                <Image src='/x-icon.png' alt='X' width={24} height={24} className='w-6 h-6 sm:w-7 sm:h-7' />
              </a>
              <a
                href='https://discord.com/invite/TXPbt7ztMC'
                target='_blank'
                rel='noopener noreferrer'
                className='p-1 sm:p-2 hover:scale-110 transition-transform'
                aria-label='Join Discord'
              >
                <Image src='/discord-icon.png' alt='Discord' width={24} height={24} className='w-6 h-6 sm:w-7 sm:h-7' />
              </a>
              {user ? (
                <a
                  href='/api/auth/logout'
                  className='px-3 py-1 sm:px-4 sm:py-2 text-[var(--text)] font-semibold rounded-full bg-[var(--error)] hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base'
                  aria-label='Sign Out'
                >
                  Sign Out
                </a>
              ) : (
                <a
                  href='/api/auth/login'
                  className='px-3 py-1 sm:px-4 sm:py-2 text-[var(--text)] font-semibold rounded-full bg-[var(--border)] hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base'
                  aria-label='Sign In'
                >
                  Sign In
                </a>
              )}
            </nav>
          </div>
        </header>
        <main className='max-w-6xl mx-auto p-4 sm:p-6 flex-grow flex flex-col'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}