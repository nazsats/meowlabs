import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';

interface DiscordUser {
  id: string;
  username: string;
}

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/auth/callback`,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get<DiscordUser>('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const user = userResponse.data;

    await setDoc(doc(db, 'users', user.id), {
      discordId: user.id,
      username: user.username,
      timestamp: new Date(),
    });

    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return NextResponse.redirect(`${baseUrl}/`);
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }
}