interface StatusPanelProps {
  primaryRole: string; // Already string, no change needed
  roles: string[]; // Role display names
  walletStatus: { submitted: boolean; timestamp?: string };
}

export default function StatusPanel({ primaryRole, roles, walletStatus }: StatusPanelProps) {
  return (
    <div className='bg-[var(--accent)] rounded-xl p-4 sm:p-8 shadow-xl border-4 border-[var(--border)] text-center animate-fade-in'>
      <h2 className='text-xl sm:text-3xl font-bold text-[var(--border)] mb-3 sm:mb-4'>Primary Role</h2>
      <p className='text-2xl sm:text-4xl mb-4 sm:mb-6 bg-[var(--border)] text-[var(--text)] py-2 sm:py-3 px-4 sm:px-6 rounded-xl animate-glow'>
        {primaryRole}
      </p>
      <div className='flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6'>
        {roles.map((role) => (
          <span
            key={role}
            className='bg-[var(--border)] text-[var(--text)] text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full'
          >
            {role}
          </span>
        ))}
      </div>
      <div>
        <h3 className='text-lg sm:text-2xl font-semibold text-[var(--border)] mb-2'>Wallet Status</h3>
        <p
          className={`text-base sm:text-lg font-bold animate-pulse-status ${
            walletStatus.submitted ? 'text-[var(--success)]' : 'text-[var(--error)]'
          } ${walletStatus.submitted ? 'scale-110' : 'scale-100'} transition-transform duration-300`}
        >
          {walletStatus.submitted ? '✅ Submitted' : '❌ Not Submitted'}
        </p>
        {walletStatus.submitted && walletStatus.timestamp && (
          <p className='text-xs sm:text-sm text-[var(--border)] mt-2'>Submitted on {walletStatus.timestamp}</p>
        )}
      </div>
    </div>
  );
}