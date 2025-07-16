import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
    if (!DISCORD_CLIENT_ID || !BASE_URL) {
      console.error('Missing DISCORD_CLIENT_ID or NEXT_PUBLIC_BASE_URL');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const redirectUri = `${BASE_URL}/api/auth/callback`;
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`;

    return NextResponse.redirect(discordAuthUrl);
  } catch (error: unknown) {
    console.error('Error in /api/auth/login:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Failed to initiate login: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}