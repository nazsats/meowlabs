import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const redirectUri = new URL('/api/auth/callback', baseUrl).toString();
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds guilds.members.read',
    state,
  });
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, { httpOnly: true, path: '/', maxAge: 10 * 60 });
  const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}