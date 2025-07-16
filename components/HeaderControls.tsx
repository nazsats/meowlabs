'use client';

import { useAccount, useDisconnect } from 'wagmi';
import Link from 'next/link';

interface HeaderControlsProps {
  user: { id: string } | null;
}

export default function HeaderControls({ user }: HeaderControlsProps) {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
      {isConnected && (
        <button
          onClick={() => disconnect()}
          className="px-3 py-1 sm:px-4 sm:py-2 text-white font-semibold rounded-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 hover:scale-105 hover:shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-300 text-sm sm:text-base"
        >
          Disconnect Wallet
        </button>
      )}
      {user ? (
        <Link
          href="/api/auth/logout"
          className="px-3 py-1 sm:px-4 sm:py-2 text-white font-semibold rounded-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 hover:scale-105 hover:shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-300 text-sm sm:text-base"
        >
          Sign Out Discord
        </Link>
      ) : (
        <Link
          href="/api/auth/login"
          className="relative text-base sm:text-lg text-[#D8B4FE] font-semibold hover:text-white hover:animate-neon transition-colors duration-300 sm:hover:after:content-[''] sm:hover:after:absolute sm:hover:after:bottom-[-4px] sm:hover:after:left-0 sm:hover:after:w-full sm:hover:after:h-[2px] sm:hover:after:bg-white sm:hover:after:animate-slide-in"
        >
          Sign In with Discord
        </Link>
      )}
    </div>
  );
}