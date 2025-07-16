'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[var(--border)] text-[var(--text)] p-4 sm:p-6 shadow-lg border-t-2 border-[var(--accent)]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8">
        <a
          href="https://x.com/CatCentsio"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 sm:p-2 hover:scale-110 hover:animate-glow transition-transform duration-300"
          aria-label="Follow on X"
        >
          <Image src="/x-icon.png" alt="X" width={24} height={24} className="w-6 h-6 sm:w-7 sm:h-7" />
        </a>
        <a
          href="https://discord.com/invite/TXPbt7ztMC"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 sm:p-2 hover:scale-110 hover:animate-glow transition-transform duration-300"
          aria-label="Join Discord"
        >
          <Image src="/discord-icon.png" alt="Discord" width={24} height={24} className="w-6 h-6 sm:w-7 sm:h-7" />
        </a>
      </div>
    </footer>
  );
}