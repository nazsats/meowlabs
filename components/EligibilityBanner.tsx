'use client';

import { motion } from 'framer-motion';

interface EligibilityBannerProps {
  isEligible: boolean;
  eligibilityMessage: string;
}

export default function EligibilityBanner({ isEligible, eligibilityMessage }: EligibilityBannerProps) {
  if (!isEligible) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-gradient-to-r from-[var(--accent)] to-[var(--border)] rounded-xl p-4 sm:p-6 shadow-xl border-2 border-[var(--error)] text-center"
      >
        <p className="text-base sm:text-lg text-[var(--error)]">
          {eligibilityMessage}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-gradient-to-r from-[var(--accent)] to-[var(--border)] rounded-xl p-4 sm:p-6 shadow-xl border-2 border-[var(--success)] text-center"
    >
      <h3 className="text-lg sm:text-xl font-bold text-[var(--text)] animate-pulse mb-2">
        {eligibilityMessage}
      </h3>
    </motion.div>
  );
}