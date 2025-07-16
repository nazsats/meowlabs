'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi';
import { nftABI } from './abi/nftABI';
import { ROLE_PROPERTIES, ROLE_HIERARCHY, GTD_ROLES } from './lib/discord';
import WalletConnectButton from '@/components/WalletConnectButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import WelcomeDashboard from '@/components/WelcomeDashboard';
import EligibilityBanner from '@/components/EligibilityBanner';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  avatar: string | null;
}

interface RoleCheckResult {
  hasEligibleRole: boolean;
  roles: string[];
  displayRoles: string[];
  highestRole: string | null;
  highestRoleName: string | null;
}

interface WalletSubmission {
  submitted: boolean;
  address?: string;
  timestamp?: string;
  nftCount?: number;
  pendingRole: string | null;
  roleStatus?: 'pending' | 'assigned';
}

const NFT_ROLE_THRESHOLDS = {
  'Meowgaverse OG': { id: '1394315298550579240', threshold: 20 },
  'Prime Pouncer': { id: '1394315521922568326', threshold: 10 },
  'Big Whisker': { id: '1394315707856060418', threshold: 5 },
  'Solo Purr': { id: '1394315844116545637', threshold: 1 },
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [highestRole, setHighestRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [walletStatus, setWalletStatus] = useState<WalletSubmission>({ submitted: false, pendingRole: null });
  const [discordRoles, setDiscordRoles] = useState<string[]>([]);

  const { address, isConnected, chainId } = useAccount();
  const { switchChain, error: switchChainError } = useSwitchChain();
  const { data: balanceData } = useBalance({ address, chainId: 10143 });
  const { data: nftBalance, error: nftError, isLoading: nftLoading } = useReadContract({
    address: '0xfa28a33f198dc84454881fbb14c9d69dea97efdb',
    abi: nftABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 10143, // monadTestnet chain ID
    query: { enabled: !!address },
  });

  const determineRoleFromNFTs = (nftCount: number): { roleName: string; roleId: string } | null => {
    if (nftCount >= 20) {
      return { roleName: 'Meowgaverse OG', roleId: NFT_ROLE_THRESHOLDS['Meowgaverse OG'].id };
    } else if (nftCount >= 10) {
      return { roleName: 'Prime Pouncer', roleId: NFT_ROLE_THRESHOLDS['Prime Pouncer'].id };
    } else if (nftCount >= 5) {
      return { roleName: 'Big Whisker', roleId: NFT_ROLE_THRESHOLDS['Big Whisker'].id };
    } else if (nftCount >= 1) {
      return { roleName: 'Solo Purr', roleId: NFT_ROLE_THRESHOLDS['Solo Purr'].id };
    }
    return null;
  };

  const getHighestRole = (discordRoles: string[], nftRole: string | null): string | null => {
    const allRoles = [...discordRoles, ...(nftRole ? [nftRole] : [])];
    if (!allRoles.length) return null;
    const highestRoleId = ROLE_HIERARCHY.find((id) =>
      allRoles.includes(ROLE_PROPERTIES[id]?.displayName)
    );
    return highestRoleId ? ROLE_PROPERTIES[highestRoleId].displayName : null;
  };

  const fetchUserAndData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoadingRoles(true);
      console.log('Fetching user data...');
      const userRes = await fetch('/api/user', {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!userRes.ok) {
        throw new Error(`User API failed: ${userRes.status} ${userRes.statusText}`);
      }
      const userData: { userId: string | null } = await userRes.json();
      console.log('User API response:', userData);

      if (!userData.userId) {
        console.log('No userId, clearing user state');
        setUser(null);
        setIsEligible(false);
        setHighestRole(null);
        setDiscordRoles([]);
        setError(null);
        setWalletStatus({ submitted: false, pendingRole: null });
        return;
      }

      console.log('Fetching token data for userId:', userData.userId);
      const tokenRes = await fetch('/api/auth/token', {
        headers: { 'X-User-Id': userData.userId },
      });
      if (!tokenRes.ok) {
        throw new Error(`Token API failed: ${tokenRes.status} ${tokenRes.statusText}`);
      }
      const tokenData: { username: string; avatar: string | null } = await tokenRes.json();
      console.log('Token API response:', tokenData);

      setUser({
        id: userData.userId,
        username: tokenData.username || 'Unknown User',
        avatar: tokenData.avatar,
      });

      console.log('Fetching roles for userId:', userData.userId, 'forceRefresh:', forceRefresh);
      const roleRes = await fetch('/api/check-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': forceRefresh ? 'no-cache' : 'default',
        },
        body: JSON.stringify({ userId: userData.userId, forceRefresh }),
      });
      if (!roleRes.ok) {
        throw new Error(`Role API failed: ${roleRes.status} ${roleRes.statusText}`);
      }
      const roleData: RoleCheckResult = await roleRes.json();
      console.log('Role check result:', JSON.stringify(roleData, null, 2));

      const walletDoc = doc(db, 'wallet-submissions', userData.userId);
      const walletSnap = await getDoc(walletDoc);
      console.log('Wallet snapshot exists:', walletSnap.exists(), 'UserId:', userData.userId);

      let isEligible = roleData.hasEligibleRole;
      let highestRole = roleData.highestRoleName;

      if (isConnected && address && !walletStatus.submitted) {
        const nftCount = nftBalance ? Number(nftBalance) : 0;
        console.log(`Processing wallet submission for user ${userData.userId} with ${nftCount} NFTs`);
        const roleAssignment = determineRoleFromNFTs(nftCount);
        await setDoc(
          doc(db, 'wallet-submissions', userData.userId),
          {
            walletAddress: address,
            nftBasedRoleName: roleAssignment?.roleName || null,
            nftCount,
            roleStatus: roleAssignment ? 'pending' : null,
            timestamp: new Date(),
          },
          { merge: true }
        );
        setWalletStatus({
          submitted: true,
          address,
          nftCount,
          pendingRole: roleAssignment?.roleName || null,
          roleStatus: roleAssignment ? 'pending' : undefined,
          timestamp: new Date().toLocaleString('en-US', {
            timeZone: 'UTC',
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        });
        if (roleAssignment) {
          isEligible = true;
          highestRole = getHighestRole(roleData.displayRoles, roleAssignment.roleName);
          toast.success(`Role ${roleAssignment.roleName} set as pending for assignment!`, {
            style: { background: '#CBC3E3', color: '#4e3a76' },
          });
        } else {
          highestRole = getHighestRole(roleData.displayRoles, null);
          toast.success('Wallet connected, but no eligible role for NFT count.', {
            style: { background: '#CBC3E3', color: '#4e3a76' },
          });
        }
      } else if (walletSnap.exists()) {
        const data = walletSnap.data();
        const currentRoles = roleData.roles;
        const pendingRoleId = data.nftBasedRoleName
          ? Object.keys(ROLE_PROPERTIES).find((id) => ROLE_PROPERTIES[id].displayName === data.nftBasedRoleName)
          : null;
        const roleAssigned = pendingRoleId && currentRoles.includes(pendingRoleId);
        if (roleAssigned && data.roleStatus === 'pending') {
          await setDoc(
            doc(db, 'wallet-submissions', userData.userId),
            { roleStatus: 'assigned' },
            { merge: true }
          );
        }
        setWalletStatus({
          submitted: true,
          address: data.walletAddress,
          nftCount: data.nftCount,
          pendingRole: data.nftBasedRoleName || null,
          roleStatus: roleAssigned ? 'assigned' : data.roleStatus,
          timestamp: new Date(data.timestamp.toDate()).toLocaleString('en-US', {
            timeZone: 'UTC',
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        });
        if (data.nftBasedRoleName) {
          isEligible = true;
          highestRole = getHighestRole(roleData.displayRoles, data.nftBasedRoleName);
        } else {
          highestRole = getHighestRole(roleData.displayRoles, null);
        }
      } else {
        setWalletStatus({ submitted: false, pendingRole: null });
        highestRole = getHighestRole(roleData.displayRoles, null);
      }

      setIsEligible(isEligible);
      setHighestRole(highestRole);
      setDiscordRoles(roleData.displayRoles);
    } catch (error: unknown) {
      console.error('fetchUserAndData error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(
        errorMessage.includes('404')
          ? 'User not found in Discord guild. Please join the server: https://discord.com/invite/TXPbt7ztMC'
          : `Failed to load user data: ${errorMessage}`
      );
    } finally {
      setIsLoadingRoles(false);
    }
  }, [nftBalance, isConnected, address, walletStatus.submitted]);

  useEffect(() => {
    fetchUserAndData();
  }, [fetchUserAndData]);

  useEffect(() => {
    if (isConnected && chainId !== 10143) {
      toast.error('Please switch to Monad Testnet', {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
    }
    if (switchChainError) {
      console.error('Switch chain error:', switchChainError);
      toast.error(`Network switch failed: ${switchChainError.message}`, {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
    }
    if (nftError && !nftError.message.includes('MetaMask extension not found')) {
      console.error('NFT error:', nftError);
      toast.error(nftError.message, {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
    }
  }, [chainId, isConnected, switchChainError, nftError]);

  useEffect(() => {
    if (!isConnected) {
      setWalletStatus({ submitted: false, pendingRole: null });
      setHighestRole(null);
      setDiscordRoles([]);
    }
  }, [isConnected]);

  useEffect(() => {
    if (walletStatus.submitted && walletStatus.roleStatus === 'pending') {
      const interval = setInterval(() => {
        fetchUserAndData(true); // Force refresh to check if role is assigned
      }, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [walletStatus, fetchUserAndData]);

  console.log('Rendering Home, isEligible:', isEligible, 'user:', user, 'isConnected:', isConnected, 'highestRole:', highestRole, 'walletStatus:', walletStatus);

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-[calc(100vh-8rem)] items-center justify-center">
        {!user && (
          <header className="w-full flex justify-end p-4">
            <Link
              href="/api/auth/login"
              className="text-base sm:text-lg text-[var(--text)] font-semibold hover:text-[var(--accent)] transition-colors duration-300"
            >
              Sign In
            </Link>
          </header>
        )}
        {error && (
          <div className="bg-[var(--error)] text-white p-3 sm:p-4 rounded-lg text-center text-sm sm:text-base max-w-md mx-auto">
            {error.includes('https://discord.com/invite') ? (
              <>
                User not found in Discord guild. Please{' '}
                <a
                  href="https://discord.com/invite/TXPbt7ztMC"
                  className="underline text-[var(--accent)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  join the server
                </a>.
              </>
            ) : (
              error
            )}
            <button
              onClick={() => fetchUserAndData(true)}
              className="ml-2 px-2 py-1 bg-[var(--border)] text-[var(--text)] rounded hover:bg-[var(--accent)]"
            >
              Retry
            </button>
          </div>
        )}
        {user && (
          <button
            onClick={() => fetchUserAndData(true)}
            className="px-4 py-2 bg-[var(--border)] text-[var(--text)] rounded-lg mb-4 hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300"
            disabled={isLoadingRoles}
          >
            {isLoadingRoles ? 'Loading Roles...' : 'Refresh Roles'}
          </button>
        )}
        {user ? (
          <div className="w-full max-w-4xl flex flex-col gap-6 sm:gap-8">
            <WelcomeDashboard
              username={user.username}
              avatar={user.avatar}
              discordRoles={discordRoles}
              nftRole={walletStatus.pendingRole}
              highestRole={highestRole}
            />
            <EligibilityBanner highestRole={highestRole} />
            <div className="bg-[var(--accent)] rounded-xl p-6 sm:p-8 shadow-xl border-4 border-[var(--border)]">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--border)] mb-4 text-center">
                Wallet & NFT Dashboard
              </h2>
              {!isConnected ? (
                <div className="text-center">
                  <p className="text-base sm:text-lg text-[var(--border)] mb-4">
                    Connect your wallet to view your balance and NFTs
                  </p>
                  <WalletConnectButton />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--border)] mb-2">Wallet Balance</h3>
                    <p className="text-base sm:text-lg text-[var(--success)]">
                      {balanceData ? `${balanceData.formatted} ${balanceData.symbol}` : 'Loading...'}
                    </p>
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--border)] mt-4 mb-2">NFT Count</h3>
                    {nftLoading && (
                      <p className="text-base sm:text-lg text-[var(--border)]">Loading NFT balance...</p>
                    )}
                    {nftError && (
                      <div className="text-[var(--error)] text-base sm:text-lg">
                        <p>Error: Please ensure you are on Monad Testnet</p>
                        <button
                          onClick={() => switchChain({ chainId: 10143 })}
                          className="mt-2 px-4 py-2 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300"
                        >
                          Switch to Monad Testnet
                        </button>
                      </div>
                    )}
                    {nftBalance !== undefined && (
                      <>
                        <p className="text-base sm:text-lg text-[var(--success)]">
                          {Number(nftBalance) || 0} {Number(nftBalance) === 1 ? 'NFT' : 'NFTs'}
                        </p>
                        {walletStatus.pendingRole && (
                          <>
                            <h3 className="text-lg sm:text-xl font-semibold text-[var(--border)] mt-4 mb-2">Pending Role</h3>
                            <p
                              className={`text-base sm:text-lg font-semibold px-3 py-1 rounded-full ${
                                GTD_ROLES.includes(walletStatus.pendingRole)
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-700 text-white'
                                  : 'bg-gradient-to-r from-green-500 to-green-700 text-white'
                              }`}
                            >
                              Pending Role: {walletStatus.pendingRole}
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--border)] mb-2">NFT Media</h3>
                    <div className="relative w-full max-w-xs rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300">
                      <video
                        src="https://teal-characteristic-reindeer-501.mypinata.cloud/ipfs/bafybeifkljwudpvlfhtcq5qrmg54hw3qu57rhtwx4zchrdiqta33xrsl4i"
                        autoPlay
                        loop
                        muted
                        className="w-full h-auto object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)]/50 to-transparent" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <h1 className="text-2xl sm:text-4xl font-bold text-[var(--text)] mb-4 sm:mb-6">Welcome to Catcents</h1>
            <p className="text-base sm:text-lg text-[var(--text)] mb-6 sm:mb-8">
              Sign in with Discord to access your dashboard.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}