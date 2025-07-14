'use client';
import Image from 'next/image';

interface WelcomeDashboardProps {
  username: string;
  avatar: string | null;
  primaryRole: string;
  roles: string[];
}

export default function WelcomeDashboard({ username, avatar, primaryRole, roles }: WelcomeDashboardProps) {
  const defaultAvatar = 'https://cdn.discordapp.com/embed/avatars/0.png';

  return (
    <div className='bg-[var(--accent)] rounded-xl p-4 sm:p-8 shadow-xl border-4 border-[var(--border)] text-center relative overflow-hidden animate-fade-in'>
      <div className='absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16'>
        <Image
          src='/pixel-cat.png'
          alt='Cat Decoration'
          width={48}
          height={48}
          className='animate-cat-bounce w-12 h-12 sm:w-16 sm:h-16'
        />
      </div>
      <div className='relative w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-4 sm:mb-6'>
        <Image
          src={avatar || defaultAvatar}
          alt={`${username}'s avatar`}
          width={96}
          height={96}
          className='rounded-full object-cover border-4 border-[var(--border)] animate-glow w-24 h-24 sm:w-32 sm:h-32'
          onError={(e) => (e.currentTarget.src = defaultAvatar)}
          priority
        />
      </div>
      <h1 className='text-2xl sm:text-4xl font-bold text-[var(--border)] mb-2'>Welcome, {username}</h1>
      <p className='text-base sm:text-lg text-[var(--border)] mb-4 sm:mb-6'>
        Logged in as{' '}
        
        <span className='font-semibold bg-[var(--border)] text-[var(--text)] px-2 py-1 rounded'>
          {primaryRole}
        </span>
      </p>
      <div className='flex flex-wrap justify-center gap-2 sm:gap-3'>
        {roles.map((role) => (
          <span
            key={role}
            className='bg-[var(--border)] text-[var(--text)] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1 sm:py-2 rounded-full animate-glow hover:scale-110 hover:rotate-2 transition-all duration-200'
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  );
}