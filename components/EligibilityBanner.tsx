'use client';

import { motion } from 'framer-motion';
import { ROLE_PROPERTIES, GTD_ROLES } from '../app/lib/discord';

interface EligibilityBannerProps {
  highestRole: string | null;
}

export default function EligibilityBanner({ highestRole }: EligibilityBannerProps) {
  if (!highestRole) {
    return null;
  }

  const eligibility = ROLE_PROPERTIES[
    Object.keys(ROLE_PROPERTIES).find((id) => ROLE_PROPERTIES[id].displayName === highestRole)!
  ]?.eligibility;
  const isGTD = GTD_ROLES.includes(highestRole);
  const message = eligibility === 'GTD'
    ? `You're eligible for a GTD mint on the mainnet with role: ${highestRole}`
    : eligibility === 'FCFS'
    ? `You're eligible for a FCFS mint on the mainnet with role: ${highestRole}`
    : `You're not eligible for a mainnet mint with role: ${highestRole}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-gradient-to-r from-[var(--accent)]/20 to-[var(--border)]/20 rounded-xl p-4 sm:p-6 shadow-xl border-4 border-[var(--border)] text-center"
    >
      <p
        className={`text-base sm:text-lg font-semibold text-[var(--text)] hover:animate-neon transition-all duration-300 ${
          isGTD ? 'bg-gradient-to-r from-yellow-500/30 to-yellow-700/30' : 'bg-gradient-to-r from-[var(--success)]/30 to-green-700/30'
        } px-4 py-2 rounded-full mb-3`}
      >
        {message}
      </p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
        className="text-sm sm:text-base font-semibold italic text-[#D8B4FE] bg-gradient-to-r from-[var(--error)]/30 to-red-700/30 px-3 py-1 rounded-full hover:animate-neon transition-all duration-300"
      >
        If you have a spot for the mainnet mint, don’t get too comfortable, your role can be purged if you stop contributing.
      </motion.p>
    </motion.div>
  );
}