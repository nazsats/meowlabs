import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios, { AxiosError } from 'axios';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      console.error('Missing X-User-Id header');
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const userDoc = doc(db, 'users', userId);
    const userSnap = await getDoc(userDoc);
    if (!userSnap.exists()) {
      console.error(`User document not found for userId: ${userId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();
    const accessToken = userData.accessToken;
    const refreshToken = userData.refreshToken;
    const expiresIn = userData.expiresIn;
    const timestamp = userData.timestamp?.toDate();
    if (!accessToken || !refreshToken || !expiresIn || !timestamp) {
      console.error(`Incomplete user data for userId: ${userId}`, { accessToken, refreshToken, expiresIn, timestamp });
      return NextResponse.json({ error: 'Incomplete user data' }, { status: 401 });
    }

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      console.error('Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check if token is expired
    const tokenAgeSeconds = (new Date().getTime() - timestamp.getTime()) / 1000;
    if (tokenAgeSeconds > expiresIn - 60) {
      console.log(`Access token expired for userId: ${userId}, attempting refresh`);
      try {
        const tokenResponse = await axios.post(
          'https://discord.com/api/oauth2/token',
          new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        await setDoc(doc(db, 'users', userId), {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
          timestamp: new Date(),
        }, { merge: true });

        console.log(`Refreshed token for userId: ${userId}`);
      } catch (refreshError: unknown) {
        console.error('Token refresh failed:', {
          userId,
          message: refreshError instanceof AxiosError ? refreshError.message : refreshError instanceof Error ? refreshError.message : 'Unknown error',
          status: refreshError instanceof AxiosError ? refreshError.response?.status : undefined,
          data: refreshError instanceof AxiosError ? refreshError.response?.data : undefined,
        });
        return NextResponse.json({ error: 'Failed to refresh token' }, { status: 401 });
      }
    }

    try {
      const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const { username, avatar } = userResponse.data;
      console.log(`Successfully fetched user data for userId: ${userId}`, { username });

      return NextResponse.json({
        username,
        avatar: avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null,
      });
    } catch (error: unknown) {
      console.error('Error fetching Discord user data:', {
        userId,
        message: error instanceof AxiosError ? error.message : error instanceof Error ? error.message : 'Unknown error',
        status: error instanceof AxiosError ? error.response?.status : undefined,
        data: error instanceof AxiosError ? error.response?.data : undefined,
      });

      return NextResponse.json(
        { error: `Failed to fetch user data: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: error instanceof AxiosError ? error.response?.status || 500 : 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error in /api/auth/token:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}