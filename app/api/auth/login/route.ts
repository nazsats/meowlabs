import { NextResponse } from 'next/server';

export async function GET() {
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;
  const SCOPES = ['identify', 'guilds', 'guilds.members.read'].join('+');
  const STATE = Math.random().toString(36).substring(2);

  if (!DISCORD_CLIENT_ID) {
    console.error('Missing DISCORD_CLIENT_ID');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPES}&state=${STATE}`;

  return NextResponse.redirect(oauthUrl);
}