import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    console.error('Missing code or state in callback');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=missing_code_or_state`);
  }

  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    console.error('Missing Discord environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token } = tokenResponse.data;

    // Fetch user data
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id } = userResponse.data;

    // Create response and set cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}`);
    response.cookies.set('user_id', id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day
    });

    return response;
  } catch (error) {
    console.error('Error in OAuth callback:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof axios.AxiosError ? error.response?.status : null,
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}?error=auth_failed`);
  }
}