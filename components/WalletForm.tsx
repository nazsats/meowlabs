'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '../app/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface WalletFormProps {
  userId: string;
}

export default function WalletForm({ userId }: WalletFormProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const validateEvmAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEvmAddress(walletAddress)) {
      setError('Please enter a valid EVM wallet address (0x...)');
      toast.error('Invalid wallet address', {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
      return;
    }

    try {
      await setDoc(doc(db, 'wallets', userId), {
        walletAddress,
        question,
        userId,
        timestamp: new Date(),
      });
      setSubmitted(true);
      toast.success('Wallet submitted successfully!', {
        icon: '✅',
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
      setTimeout(() => router.push('/'), 3000);
    } catch (err) {
      setError('Failed to submit wallet. Please try again.');
      toast.error('Submission failed', {
        style: { background: '#CBC3E3', color: '#4e3a76' },
      });
      console.error(err);
    }
  };

  return (
    <div className='bg-[var(--accent)] rounded-xl p-4 sm:p-8 shadow-xl border-4 border-[var(--border)] relative'>
      <div className='absolute to
p-2 sm:top-4 right-2 sm:right-4 w-8 sm:w-12 h-8 sm:h-12'>
        <Image
          src='/pixel-cat.png'
          alt='Cat Icon'
          width={32}
          height={32}
          className='animate-cat-bounce w-8 h-8 sm:w-12 sm:h-12'
        />
      </div>
      <h2 className='text-xl sm:text-3xl font-bold text-[var(--border)] mb-4 sm:mb-6'>Submit Your Wallet</h2>
      {!submitted ? (
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 sm:gap-5'>
          <div>
            <input
              type='text'
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder='Enter your EVM Wallet (0x...)'
              className='w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[var(--border)] rounded-lg text-[var(--border)] placeholder-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm sm:text-base'
              aria-label='EVM Wallet Address'
            />
            {error && walletAddress && !validateEvmAddress(walletAddress) && (
              <p className='text-[var(--error)] text-xs sm:text-sm mt-1'>{error}</p>
            )}
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='How do you plan to contribute to Catcents post-mint?'
            className='w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-[var(--border)] rounded-lg text-[var(--border)] placeholder-[var(--border)] bg-[var(--background)] h-24 sm:h-32 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm sm:text-base'
            aria-label='Contribution Plan'
          />
          <p className='text-[var(--error)] text-xs sm:text-sm'>
            Selling your NFT below 699 incurs a 69.9% royalty fee.
          </p>
          <button
            type='submit'
            className='px-4 sm:px-6 py-2 sm:py-3 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base'
            disabled={submitted}
          >
            <span>Submit</span>
            <Image src='/pixel-cat.png' alt='Cat' width={20} height={20} className='w-5 h-5 sm:w-6 sm:h-6 animate-cat-bounce' />
          </button>
        </form>
      ) : (
        <div className='text-center'>
          <p className='text-[var(--success)] text-base sm:text-lg mb-4 sm:mb-6'>
            Lastly, you need to share a tweet to verify your proof of contribution.
          </p>
          <a
            href='https://twitter.com/intent/tweet?text=I%20submitted%20my%20wallet%20for%20@CatCentsio%20WL.%20Join%20me%20at%20https%3A%2F%2Fwww.catcents.io%20!'
            target='_blank'
            rel='noopener noreferrer'
            className='px-4 sm:px-6 py-2 sm:py-3 bg-[var(--border)] text-[var(--text)] rounded-lg hover:bg-[var(--accent)] hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 mx-auto text-sm sm:text-base'
          >
            <Image src='/x-icon.png' alt='X Icon' width={20} height={20} className='w-5 h-5 sm:w-6 sm:h-6' />
            <span>Share on X</span>
          </a>
        </div>
      )}
    </div>
  );
}