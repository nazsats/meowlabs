import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    await setDoc(doc(db, 'wallets', address), {
      walletAddress: address,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving wallet:', error);
    return NextResponse.json({ error: 'Failed to save wallet' }, { status: 500 });
  }
}