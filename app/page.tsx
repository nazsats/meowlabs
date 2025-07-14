'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAccount, useBalance, useReadContract, useSwitchChain } from 'wagmi';
import { nftABI } from './abi/nftABI';
import { checkUserRole, getRoleProperties } from './lib/discord';
import EligibilityBanner from '@/components/EligibilityBanner';
import WalletConnectButton from '@/components/WalletConnectButton';

interface User {
  id: string;
  username: string;
  avatar: string | null;
}

const GTD_ROLE_IDS = [
  '1271065450054418564', // Meow Mavens
  '1272820953172152351', // OG Cat
  '1272821145519001620', // X-Advocate
  '1366405823080693860', // Catcents Legend
  '1366405821206102046', // Mythic Pouncer
  '1271757404945649664', // Active Paw
  '1394315521922568326', // Prime Pouncer
  '1394315298550579240', // Meowgaverse OG
  '1394315707856060418', // Big Whisker
  '1394315844116545637', // Solo Purr
];

const NFT_ROLE_THRESHOLDS = [
  { id: '1394315298550579240', name: 'Meowgaverse OG', threshold: 20 },
  { id: '1394315521922568326', name: 'Prime Pouncer', threshold: 10 },
  { id: '1394315707856060418', name: 'Big Whisker', threshold: 5 },
  { id: '1394315844116545637', name: 'Solo Purr', threshold: 1 },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isEligible, setIsEligible] = useState(false);
  const [highestNFTBasedRole, setHighestNFTBasedRole] = useState<string | null>(null);
  const [highestRoleType, setHighestRoleType] = useState<'GTD' | 'FCFS' | null>(null);
  const [highestRoleMintPhase, setHighestRoleMintPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<{ submitted: boolean; address?: string; timestamp?: string }>({
    submitted: false,
  });

  const { address, isConnected, chainId } = useAccount();
  const { switchChain, error: switchChainError } = useSwitchChain();
  const { data: balanceData } = useBalance({ address, chainId: 10143 });
  const { data: nftBalance, error: nftError, isLoading: nftLoading } = useReadContract({
    address: '0xfa28a33f198dc84454881fbb14c9d69dea97efdb',
    abi: nftABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 10143, // monadTestnet chain ID
    query: { enabled: !!address }, // Only run query if address is defined
  });

  // Save wallet address and NFT-based role to Firestore
  useEffect(() => {
    if (isConnected && address && user?.id && !walletStatus.submitted) {
      const saveWalletAndRole = async () => {
        try {
          const nftCount = nftBalance ? Number(nftBalance) : 0;
          const role = NFT_ROLE_THRESHOLDS.find((r) => nftCount >= r.threshold);
          const roleId = role ? role.id : null;
          const roleName = role ? role.name : null;

          await setDoc(doc(db, 'wallets', user.id), {
            walletAddress: address,
            nftBasedRoleId: roleId,
            nftBasedRoleName: roleName,
            nftCount,
            timestamp: new Date(),
          });

          setWalletStatus({
            submitted: true,
            address,
            timestamp: new Date().toLocaleString('en-US', {
              timeZone: 'UTC',
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
          });
          setHighestNFTBasedRole(roleName);

          toast.success('Wallet connected and role assigned!', {
            style: { background: '#CBC3E3', color: '#4e3a76' },
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(`Failed to save wallet: ${errorMessage}`, {
            style: { background: '#CBC3E3', color: '#4e3a76' },
          });
        }
      };
      saveWalletAndRole();
    }
  }, [isConnected, address, user?.id, walletStatus.submitted, nftBalance]);

  // Reset walletStatus on disconnect
  useEffect(() => {
    if (!isConnected) {
      setWalletStatus({ submitted: false });
      setHighestNFTBasedRole(null);
    }
  }, [isConnected]);

  // Handle network errors and prompt network switch
  useEffect(() => {
    if (isConnected && chainId !== 10143) {
      toast.error('Please switch to Monad Testnet', {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
    }
    if (switchChainError) {
      toast.error(`Network switch failed: ${switchChainError.message}`, {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
    }
    if (nftError) {
      toast.error(nftError.message, {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
    }
  }, [chainId, isConnected, switchChainError, nftError]);

  // Fetch Discord user and check eligibility
  const fetchUserAndData = useCallback(async (forceRefresh = false) => {
    try {
      const userRes = await fetch('/api/user', { credentials: 'include' });
      if (!userRes.ok) throw new Error(`User API failed: ${userRes.statusText}`);
      const userData: { userId: string | null } = await userRes.json();
      console.log('User API response:', userData);
      if (!userData.userId) {
        console.log('No userId, showing auth button');
        setUser(null);
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

      const roleRes = await checkUserRole(userData.userId, forceRefresh);
      console.log('Role check result:', roleRes);

      const hasGTDRole = roleRes.roles.some((roleId) => GTD_ROLE_IDS.includes(roleId));
      const hasEnoughNFTs = nftBalance !== undefined && Number(nftBalance) >= 5;
      setIsEligible(hasGTDRole || hasEnoughNFTs);

      // Determine highest role type and mint phase
      const highestRoleId = roleRes.highestRole || (hasEnoughNFTs && NFT_ROLE_THRESHOLDS.find((r) => Number(nftBalance) >= r.threshold)?.id) || null;
      const roleProperties = highestRoleId ? getRoleProperties(highestRoleId) : null;
      setHighestRoleType(roleProperties?.type || null);
      setHighestRoleMintPhase(roleProperties?.mintPhase || null);

      const walletDoc = doc(db, 'wallets', userData.userId);
      const walletSnap = await getDoc(walletDoc);
      console.log('Wallet snapshot exists:', walletSnap.exists(), 'UserId:', userData.userId);
      if (walletSnap.exists()) {
        const data = walletSnap.data();
        setWalletStatus({
          submitted: true,
          address: data.walletAddress,
          timestamp: new Date(data.timestamp.toDate()).toLocaleString('en-US', {
            timeZone: 'UTC',
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        });
        setHighestNFTBasedRole(data.nftBasedRoleName || null);
      } else {
        setWalletStatus({ submitted: false });
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(
        errorMessage.includes('404')
          ? 'User not found in Discord guild. Please join the server.'
          : `Failed to load user data: ${errorMessage}`
      );
    }
  }, [nftBalance]);

  useEffect(() => {
    fetchUserAndData();
  }, [fetchUserAndData]);

  console.log('Rendering Home, isEligible:', isEligible, 'user:', user, 'isConnected:', isConnected, 'highestNFTBasedRole:', highestNFTBasedRole, 'highestRoleType:', highestRoleType, 'highestRoleMintPhase:', highestRoleMintPhase);

  // Sign out handler
  const handleSignOut = () => {
    window.location.href = '/api/auth/logout';
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] items-center justify-center">
      {error && (
        <div className="bg-[var(--error)] text-white p-3 sm:p-4 rounded-lg text-center text-sm sm:text-base">
          {error}
          <button
            onClick={() => fetchUserAndData(true)}
            className="ml-2 px-2 py-1 bg-[var(--border)] text-[var(--text)] rounded hover:bg-[var(--accent)]"
          >
            Retry
          </button>
        </div>
      )}
      {user ? (
        <div className="w-full max-w-4xl flex flex-col gap-6 sm:gap-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              Welcome, {user.username}
            </h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-sm sm:text-base font-semibold"
            >
              Sign Out
            </button>
          </div>
          <EligibilityBanner
            isEligible={isEligible}
            nftBasedRole={highestNFTBasedRole}
            highestRoleType={highestRoleType}
            highestRoleMintPhase={highestRoleMintPhase}
          />
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
                    <p className="text-base sm:text-lg text-[var(--success)]">
                      {nftBalance.toString()} NFTs
                    </p>
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
          <a
            href="/api/auth/login"
            className="px-6 py-3 sm:px-8 sm:py-4 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 text-base sm:text-lg font-semibold"
          >
            Sign In with Discord
          </a>
        </div>
      )}
    </div>
  );
}