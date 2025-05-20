import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='bg-[var(--border)] text-[var(--text)] p-4 sm:p-6 mt-auto shadow-lg animate-fade-in'>
      <div className='max-w-6xl mx-auto flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-xs sm:text-sm uppercase font-semibold'>
        <a
          href='https://discord.com/invite/TXPbt7ztMC'
          className='hover:text-[var(--accent)] hover:scale-105 transition-all duration-300'
          aria-label='Discord'
        >
          Discord
        </a>
        <span className='hidden sm:inline'>|</span>
        <Link
          href='https://deets.catcents.io/'
          className='hover:text-[var(--accent)] hover:scale-105 transition-all duration-300'
        >
          Deets
        </Link>
        <span className='hidden sm:inline'>|</span>
        <a
          href='https://catcents.gitbook.io/catcents'
          className='hover:text-[var(--accent)] hover:scale-105 transition-all duration-300'
          aria-label='Catcents Website'
        >
          Gitbook
        </a>
        <span className='hidden sm:inline'>|</span>
        <Link
          href='https://www.catcents.io/dashboard'
          className='hover:text-[var(--accent)] hover:scale-105 transition-all duration-300'
        >
          Playground
        </Link>
      </div>
    </footer>
  );
}