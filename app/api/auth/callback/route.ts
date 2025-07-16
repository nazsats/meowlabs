import { NextResponse } from 'next/server';
import axios from 'axios';
import { db } from '../../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  if (!BASE_URL) {
    console.error('Missing NEXT_PUBLIC_BASE_URL');
    return NextResponse.redirect(`${BASE_URL}?error=server_config_error`);
  }

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(`${BASE_URL}?error=${error}`);
  }

  if (!code) {
    console.error('Missing code parameter');
    return NextResponse.redirect(`${BASE_URL}?error=missing_code`);
  }

  try {
    const response = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${BASE_URL}/api/auth/callback`,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { id } = userResponse.data;

    // Store tokens in Firestore
    await setDoc(doc(db, 'users', id), {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      timestamp: new Date(),
    }, { merge: true });

    const redirect = NextResponse.redirect(BASE_URL);
    redirect.cookies.set('user_id', id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    });

    console.log('OAuth callback successful for user:', id);
    return redirect;
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${BASE_URL}?error=authentication_failed`);
  }
}