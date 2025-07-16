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
    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
      {isConnected && (
        <button
          onClick={() => disconnect()}
          className="px-3 py-1 sm:px-4 sm:py-2 text-[var(--text)] font-semibold rounded-full bg-[var(--error)] hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base"
        >
          Disconnect Wallet
        </button>
      )}
      {user ? (
        <Link
          href="/api/auth/logout"
          className="px-3 py-1 sm:px-4 sm:py-2 text-[var(--text)] font-semibold rounded-full bg-[var(--error)] hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base"
        >
          Sign Out Discord
        </Link>
      ) : (
        <Link
          href="/api/auth/login"
          className="text-base sm:text-lg text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors duration-300"
        >
          Sign In with Discord
        </Link>
      )}
    </div>
  );
}