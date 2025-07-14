import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--border)] text-[var(--text)] p-4 sm:p-6 shadow-lg border-t-2 border-[var(--accent)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm uppercase font-semibold">
        <Link
          href="https://www.catcents.io"
          className="hover:text-[var(--accent)] hover:scale-105 transition-all duration-300"
        >
          Catcents
        </Link>
        <span className="hidden sm:inline text-[var(--text)] opacity-50">|</span>
        <Link
          href="https://deets.catcents.io/"
          className="hover:text-[var(--accent)] hover:scale-105 transition-all duration-300"
        >
          Deets
        </Link>
      </div>
    </footer>
  );
}