'use client';
import { useState, useEffect } from 'react';
import WelcomeDashboard from '../components/WelcomeDashboard';
import StatusPanel from '../components/StatusPanel';
import WalletForm from '../components/WalletForm';
import InfoPanel from '../components/InfoPanel';
import Footer from '../components/Footer';
import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface User {
  id: string;
  username: string;
  avatar: string | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [hasEligibleRole, setHasEligibleRole] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [highestRole, setHighestRole] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<{ submitted: boolean; timestamp?: string }>({
    submitted: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserAndData() {
      try {
        const userRes = await fetch('/api/user', { credentials: 'include' });
        if (!userRes.ok) throw new Error(`User API failed: ${userRes.statusText}`);
        const userData: { userId: string | null } = await userRes.json();
        console.log('User API response:', userData);
        if (!userData.userId) {
          console.log('No userId, showing auth button');
          setUser(null);
          setLoading(false);
          return;
        }

        const tokenRes = await fetch('/api/auth/token', {
          headers: { 'X-User-Id': userData.userId },
        });
        if (!tokenRes.ok) throw new Error(`Token API failed: ${tokenRes.statusText}`);
        const tokenData: { username: string; avatar: string | null } = await tokenRes.json();
        console.log('Token API response:', tokenData);

        setUser({
          id: userData.userId,
          username: tokenData.username || 'Unknown User',
          avatar: tokenData.avatar,
        });

        const roleRes = await fetch(`/api/check-role?userId=${userData.userId}`);
        if (!roleRes.ok) throw new Error(`Role API failed: ${roleRes.statusText}`);
        const roleData: { hasEligibleRole?: boolean; roles: string[]; highestRole: string | null; error?: string } =
          await roleRes.json();
        console.log('Role API response (full):', roleData);
        if (roleData.error) {
          setError(roleData.error);
        } else {
          const eligibleRoles = [
            'Meow Mavens',
            'Community Manager',
            'Purrfect Mod',
            'OG Cat',
            'X-Advocate',
            'Claw Collector',
            'Active Paw',
            'Monad Veteran',
            'Early Kitten',
            'Pawthfinder',
            'Yarn Master',
            'Alley Alpha',
            'Shadow Stalker',
            'Furion Elite',
            'Mythic Pouncer',
            'Catcents Legend',
            'Catlist',
            'Test Catlist Role',
            'Game Champion',
            'Whisker Initiate',
          ];
          const eligible = roleData.hasEligibleRole !== undefined
            ? roleData.hasEligibleRole
            : roleData.roles.some((role) => eligibleRoles.includes(role));
          setHasEligibleRole(eligible);
          setRoles(roleData.roles || []);
          setHighestRole(roleData.highestRole || null);
        }

        const walletDoc = doc(db, 'wallets', userData.userId);
        const walletSnap = await getDoc(walletDoc);
        console.log('Wallet snapshot exists:', walletSnap.exists(), 'UserId:', userData.userId);
        if (walletSnap.exists()) {
          const data = walletSnap.data();
          setWalletStatus({
            submitted: true,
            timestamp: new Date(data.timestamp.toDate()).toLocaleString('en-US', {
              timeZone: 'UTC',
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          });
        } else {
          setWalletStatus({ submitted: false });
        }
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Failed to load user data: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndData();
  }, []);

  useEffect(() => {
    console.log('State - hasEligibleRole:', hasEligibleRole, 'walletStatus:', walletStatus, 'roles:', roles);
    if (hasEligibleRole && !walletStatus.submitted) {
      console.log('WalletForm should be visible');
    } else {
      console.log('WalletForm hidden - Eligible:', hasEligibleRole, 'Submitted:', walletStatus.submitted);
    }
  }, [hasEligibleRole, walletStatus, roles]);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin h-10 w-10 sm:h-12 sm:w-12 border-4 border-[var(--accent)] border-t-transparent rounded-full' />
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 sm:gap-6'>
      {error && <div className='bg-[var(--error)] text-white p-3 sm:p-4 rounded-lg text-center text-sm sm:text-base'>{error}</div>}
      {user ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
          <div className='flex flex-col gap-4 sm:gap-6'>
            <WelcomeDashboard
              username={user.username}
              avatar={user.avatar}
              primaryRole={highestRole || 'Member'}
              roles={roles}
            />
            <InfoPanel roles={roles} />
          </div>
          <div className='flex flex-col gap-4 sm:gap-6'>
            <StatusPanel primaryRole={highestRole || 'Member'} roles={roles} walletStatus={walletStatus} />
            {hasEligibleRole && !walletStatus.submitted ? (
              <WalletForm userId={user.id} />
            ) : (
              <div className='bg-[var(--accent)] rounded-xl p-6 sm:p-8 shadow-xl border-4 border-[var(--border)] text-center'>
                {hasEligibleRole && walletStatus.submitted ? (
                  <p className='text-[var(--success)] text-base sm:text-lg'>Wallet already submitted!</p>
                ) : (
                  <p className='text-[var(--border)] text-base sm:text-lg'>
                    You need an eligible role to submit a wallet (e.g., Early Kitten, Meow Mavens, Catlist).
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className='text-center py-8 sm:py-12'>
          <h1 className='text-2xl sm:text-4xl font-bold text-[var(--text)] mb-4 sm:mb-6'>Welcome to Catcents</h1>
          <p className='text-base sm:text-lg text-[var(--text)] mb-6 sm:mb-8'>Sign in with Discord to access your dashboard.</p>
          <a
            href='/api/auth/login'
            className='px-6 py-3 sm:px-8 sm:py-4 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-base sm:text-lg font-semibold'
          >
            Sign In with Discord
          </a>
        </div>
      )}
      <Footer />
    </div>
  );
}