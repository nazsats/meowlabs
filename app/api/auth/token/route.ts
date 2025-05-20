import { NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  const userId = request.headers.get('X-User-Id');
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  try {
    const userDoc = doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    if (!userSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { discordId, username } = userSnap.data();

    // Fetch user info from Discord API
    const userResponse = await axios.get(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });

    const user = userResponse.data;
    const avatar = user.avatar
      ? `https://cdn.discordapp.com/avatars/${discordId}/${user.avatar}.png`
      : null;

    // Update Firestore with latest data
    await setDoc(userDoc, { username: user.username, avatar }, { merge: true });

    return NextResponse.json({
      username: user.username || username || 'Unknown User',
      avatar,
    });
  } catch (error: unknown) {
    console.error('Error fetching user info:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 500 });
  }
}