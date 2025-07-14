'use client';

import { motion } from 'framer-motion';

interface EligibilityBannerProps {
  isEligible: boolean;
  nftBasedRole: string | null;
  highestRoleType: 'GTD' | 'FCFS' | null;
  highestRoleMintPhase: string | null;
}

export default function EligibilityBanner({
  isEligible,
  nftBasedRole,
  highestRoleType,
  highestRoleMintPhase,
}: EligibilityBannerProps) {
  if (!isEligible && !nftBasedRole) return null;

  const getEligibilityMessage = () => {
    if (!isEligible) return null;
    if (highestRoleType === 'GTD') {
      return `🎉 You're eligible for GTD mint on the Mainnet! 🎉`;
    }
    if (highestRoleType === 'FCFS') {
      return `🎉 You're eligible for FCFS mint in ${highestRoleMintPhase || 'Phase 2'}! 🎉`;
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-gradient-to-r from-[var(--accent)] to-[var(--border)] rounded-xl p-4 sm:p-6 shadow-xl border-2 border-[var(--success)] text-center"
    >
      {isEligible && (
        <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] animate-pulse mb-2">
          {getEligibilityMessage()}
        </h3>
      )}
      {nftBasedRole && (
        <p className="text-base sm:text-lg text-[var(--success)]">
          Assigned Role: <span className="font-semibold">{nftBasedRole}</span>
        </p>
      )}
    </motion.div>
  );
}