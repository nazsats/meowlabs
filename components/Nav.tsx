'use client';

import { useState } from 'react';
import Link from 'next/link';
import HeaderControls from './HeaderControls';

const externalLinks = {
  playground: process.env.NEXT_PUBLIC_PLAYGROUND_URL || 'https://www.catcents.io/dashboard',
  deets: process.env.NEXT_PUBLIC_DEETS_URL || 'https://deets.catcents.io/',
};

interface NavProps {
  user: { id: string } | null;
}

export default function Nav({ user }: NavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="flex items-center">
      <button
        className="sm:hidden text-[var(--text)] focus:outline-none"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 animate-glow"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>
      <div
        className={`${
          isMenuOpen ? 'flex' : 'hidden'
        } sm:flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-gradient-to-r from-[rgba(75,29,149,0.3)] to-[rgba(139,92,246,0.3)] backdrop-blur-md sm:backdrop-blur-lg p-4 sm:p-2 rounded-lg sm:rounded-full border border-[var(--accent)] sm:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300`}
      >
        <Link
          href={externalLinks.playground}
          className="relative text-base sm:text-lg text-[#D8B4FE] font-semibold hover:text-white hover:animate-neon transition-colors duration-300 sm:hover:after:content-[''] sm:hover:after:absolute sm:hover:after:bottom-[-4px] sm:hover:after:left-0 sm:hover:after:w-full sm:hover:after:h-[2px] sm:hover:after:bg-white sm:hover:after:animate-slide-in"
        >
          Playground
        </Link>
        <Link
          href={externalLinks.deets}
          className="relative text-base sm:text-lg text-[#D8B4FE] font-semibold hover:text-white hover:animate-neon transition-colors duration-300 sm:hover:after:content-[''] sm:hover:after:absolute sm:hover:after:bottom-[-4px] sm:hover:after:left-0 sm:hover:after:w-full sm:hover:after:h-[2px] sm:hover:after:bg-white sm:hover:after:animate-slide-in"
        >
          Deets
        </Link>
        <HeaderControls user={user} />
      </div>
    </nav>
  );
}