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
      className={`bg-[var(--accent)] rounded-xl p-4 sm:p-6 shadow-xl border-4 border-[var(--border)] text-center bg-[url('/images/cat-pattern.png')] bg-opacity-10 ${
        isGTD ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-700/20' : 'bg-gradient-to-r from-green-500/20 to-green-700/20' // Green for FCFS
      }`}
    >
      <p
        className={`text-base sm:text-lg font-semibold ${
          isGTD ? 'text-yellow-600' : 'text-green-600' // Green text for FCFS
        }`}
      >
        {message}
      </p>
    </motion.div>
  );
}