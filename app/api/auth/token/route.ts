import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  const { headers } = request;
  const userId = headers.get('X-User-Id');

  if (!userId) {
    console.error('Missing X-User-Id header');
    return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
  }

  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

  if (!DISCORD_BOT_TOKEN) {
    console.error('Missing DISCORD_BOT_TOKEN');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Fetch user data from Discord API
    const userResponse = await axios.get(`https://discord.com/api/users/${userId}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    });

    const { username, avatar } = userResponse.data;

    return NextResponse.json({
      username: username || 'Unknown User',
      avatar: avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null,
    });
  } catch (error) {
    console.error('Error fetching Discord user data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: error instanceof axios.AxiosError ? error.response?.status : null,
      data: error instanceof axios.AxiosError ? error.response?.data : null,
    });
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
  }
}