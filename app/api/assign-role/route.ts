import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { ROLE_PROPERTIES } from '../../lib/discord';

export async function POST(request: Request) {
  let userId: string | null = null;
  let roleName: string | null = null;

  try {
    const body = await request.json();
    userId = body.userId;
    roleName = body.roleName;
    console.log('Received role assignment request for userId:', userId, 'roleName:', roleName);

    if (!userId || !roleName) {
      console.error('Missing userId or roleName in request');
      return NextResponse.json({ error: 'Missing userId or roleName' }, { status: 400 });
    }
    if (!/^\d{17,19}$/.test(userId)) {
      console.error('Invalid userId format:', userId);
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    const roleId = Object.keys(ROLE_PROPERTIES).find(
      (id) => ROLE_PROPERTIES[id].displayName === roleName
    );
    if (!roleId) {
      console.error('Invalid roleName:', roleName);
      return NextResponse.json({ error: 'Invalid roleName' }, { status: 400 });
    }

    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
      console.error('Missing environment variables: DISCORD_BOT_TOKEN or DISCORD_GUILD_ID');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log(`Assigning role ${roleName} (ID: ${roleId}) to user ${userId} in guild ${DISCORD_GUILD_ID}`);
    await axios.put(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}/roles/${roleId}`,
      {},
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    console.log(`Successfully assigned role ${roleName} to user ${userId}`);
    return NextResponse.json({ success: true, roleName });
  } catch (err: unknown) {
    console.error('Error assigning role for user', userId ?? 'unknown', ':', {
      message: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof AxiosError && err.response?.status === 404) {
      console.log(`User ${userId ?? 'unknown'} not found in guild ${process.env.DISCORD_GUILD_ID}`);
      return NextResponse.json({ error: 'User not found in guild' }, { status: 404 });
    }
    if (err instanceof AxiosError && err.response?.status === 403) {
      console.error('Bot lacks permissions to assign roles');
      return NextResponse.json({ error: 'Bot lacks permissions to assign roles' }, { status: 403 });
    }
    return NextResponse.json(
      { error: `Failed to assign role: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}