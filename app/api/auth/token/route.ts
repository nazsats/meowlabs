import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { headers } = request;
  const userId = headers.get('X-User-Id');

  if (!userId) {
    console.error('Missing X-User-Id header');
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
  }

  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
  const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_GUILD_ID) {
    console.error('Missing Discord environment variables');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Fetch user data from Discord API
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${process.env.DISCORD_BOT_TOKEN}` },
    });

    const { username, avatar } = userResponse.data;

    return NextResponse.json({
      username,
      avatar: avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null,
    });
  } catch (error) {
    console.error('Error fetching Discord user data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof axios.AxiosError ? error.response?.status : null,
    });
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}