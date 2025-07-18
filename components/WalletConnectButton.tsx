'use client';

export default function WalletConnectButton() {
  return (
    <div className="flex justify-center">
      <div className="px-6 py-3 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:text-white hover:scale-105 transition-all duration-300 text-base font-semibold">
        <appkit-button />
      </div>
    </div>
  );
}