import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ROLE_PROPERTIES, ELIGIBLE_ROLES, ROLE_HIERARCHY } from '../../lib/discord';

interface DiscordRole {
  id: string;
  name: string;
}

interface RoleCheckResult {
  hasEligibleRole: boolean;
  roles: string[];
  displayRoles: string[];
  highestRole: string | null;
  highestRoleName: string | null;
}

async function retryRequest<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof AxiosError && (err.response?.status === 429 || err.response?.status === 503)) {
        const retryAfter = err.response?.headers['retry-after']
          ? parseInt(err.response.headers['retry-after']) * 1000
          : delay * Math.pow(2, i);
        console.log(`Retrying after ${retryAfter}ms due to ${err.response?.status}`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}

export async function POST(request: Request) {
  let userId: string | null = null;
  try {
    const { userId: requestUserId, forceRefresh } = await request.json();
    userId = requestUserId;
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const cacheDoc = doc(db, 'roleChecks', userId);
    const cacheSnap = await getDoc(cacheDoc);
    const cacheData = cacheSnap.data();
    const cacheAgeHours = cacheData?.timestamp
      ? (new Date().getTime() - cacheData.timestamp.toDate().getTime()) / 1000 / 60 / 60
      : null;

    if (!forceRefresh && cacheSnap.exists() && cacheAgeHours && cacheAgeHours < 1) {
      console.log('Using cached role check for user:', userId, cacheData);
      return NextResponse.json(cacheData);
    }

    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
      console.error('Missing environment variables: DISCORD_BOT_TOKEN or DISCORD_GUILD_ID');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('Fetching guild roles for guild:', DISCORD_GUILD_ID);
    const rolesResponse = await retryRequest(() =>
      axios.get(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      })
    ).catch((err) => {
      console.error('Error fetching guild roles:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
    });
    console.log('Guild roles fetched:', rolesResponse.data.map((r: DiscordRole) => ({ id: r.id, name: r.name })));

    const roleMap = new Map<string, string>();
    rolesResponse.data.forEach((role: DiscordRole) => {
      roleMap.set(role.id, role.name);
    });

    console.log('Fetching member data for user:', userId);
    const memberResponse = await retryRequest(() =>
      axios.get(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${userId}`, {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      })
    ).catch((err) => {
      console.error('Error fetching member data:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw err;
    });

    const member = memberResponse.data;
    console.log('Raw member roles for user', userId, ':', member.roles);

    const userRoles = member.roles.filter((roleId: string) => ELIGIBLE_ROLES.includes(roleId));
    const displayRoles = userRoles.map((roleId: string) => ROLE_PROPERTIES[roleId]?.displayName || 'Unknown Role');

    const hasEligibleRole = userRoles.length > 0;
    console.log(`User ${userId} has eligible roles: ${hasEligibleRole}, roles: ${userRoles.join(', ')}, display: ${displayRoles.join(', ')}`);

    const highestRole = userRoles.length
      ? ROLE_HIERARCHY.find((roleId) => userRoles.includes(roleId)) || null
      : null;
    const highestRoleName = highestRole ? ROLE_PROPERTIES[highestRole]?.displayName || 'Unknown Role' : null;

    const result: RoleCheckResult = { hasEligibleRole, roles: userRoles, displayRoles, highestRole, highestRoleName };
    await setDoc(cacheDoc, { ...result, timestamp: new Date() });
    console.log('Saved role check to cache:', result);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('Error checking user role:', {
      message: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof AxiosError && err.response?.status === 404) {
      console.log(`User ${userId ?? 'unknown'} not found in guild`);
      return NextResponse.json({ hasEligibleRole: false, roles: [], displayRoles: [], highestRole: null, highestRoleName: null });
    }
    return NextResponse.json(
      { error: `Failed to check role: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}