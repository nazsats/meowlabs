'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { GTD_ROLES } from '../app/lib/discord';

interface WelcomeDashboardProps {
  username: string;
  avatar: string | null;
  discordRoles: string[];
  nftRole: string | null;
  highestRole: string | null;
}

export default function WelcomeDashboard({ username, avatar, discordRoles, nftRole, highestRole }: WelcomeDashboardProps) {
  const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
  const isGTD = highestRole && GTD_ROLES.includes(highestRole);
  // Deduplicate roles using a Set
  const allRoles = [...new Set([...discordRoles, ...(nftRole ? [nftRole] : [])])].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', type: 'spring', stiffness: 80 }}
      className="bg-[var(--accent)] rounded-xl p-4 sm:p-8 shadow-xl border-4 border-[var(--border)] text-center relative overflow-hidden bg-[url('/images/cat-pattern.png')] bg-opacity-10"
    >
      <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16">
        <Image
          src="/pixel-cat.png"
          alt="Cat Decoration"
          width={48}
          height={48}
          className="animate-[bounce_2s_infinite] w-12 h-12 sm:w-16 sm:h-16"
        />
      </div>
      <div className="relative w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-4 sm:mb-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 3 } }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-50"
        />
        <Image
          src={avatar || defaultAvatar}
          alt={`${username}'s avatar`}
          width={96}
          height={96}
          className="rounded-full object-cover border-4 border-[var(--border)] relative z-10 w-24 h-24 sm:w-32 sm:h-32"
          onError={(e) => (e.currentTarget.src = defaultAvatar)}
          priority
        />
      </div>
      <h1 className="text-2xl sm:text-4xl font-bold text-[var(--border)] mb-4 sm:mb-6">{`Welcome, ${username}`}</h1>
      {allRoles.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {allRoles.map((role, index) => (
            <p
              key={`${role}-${index}`} // Unique key using role and index
              className={`text-base sm:text-lg font-semibold px-4 py-2 rounded-full ${
                role === highestRole
                  ? isGTD
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-700 text-white font-bold shadow-md'
                    : 'bg-gradient-to-r from-green-500 to-green-700 text-white font-bold shadow-md' // Green for FCFS
                  : 'bg-[var(--border)] text-[var(--text)]'
              }`}
            >
              {role}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}