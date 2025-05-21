import axios from 'axios';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface DiscordRole {
  id: string;
  name: string;
}

const ROLE_PROPERTIES: Record<string, { type: 'GTD' | 'FCFS'; mintPhase: string }> = {
  'Meow Mavens': { type: 'GTD', mintPhase: 'Phase 1' },
  'Community Manager': { type: 'GTD', mintPhase: 'Phase 1' },
  'Purrfect Mod': { type: 'GTD', mintPhase: 'Phase 1' },
  'OG Cat': { type: 'GTD', mintPhase: 'Phase 1' },
  'X-Advocate': { type: 'GTD', mintPhase: 'Phase 1' },
  'Claw Collector': { type: 'GTD', mintPhase: 'Phase 1' },
  'Active Paw': { type: 'GTD', mintPhase: 'Phase 1' },
  'Monad Veteran': { type: 'GTD', mintPhase: 'Phase 1' },
  'Early Kitten': { type: 'GTD', mintPhase: 'Phase 1' },
  'Pawthfinder': { type: 'GTD', mintPhase: 'Phase 1' },
  'Yarn Master': { type: 'GTD', mintPhase: 'Phase 1' },
  'Alley Alpha': { type: 'GTD', mintPhase: 'Phase 1' },
  'Shadow Stalker': { type: 'GTD', mintPhase: 'Phase 1' },
  'Furion Elite': { type: 'GTD', mintPhase: 'Phase 1' },
  'Mythic Pouncer': { type: 'GTD', mintPhase: 'Phase 1' },
  'Catcents Legend': { type: 'GTD', mintPhase: 'Phase 1' },
  'Catlist': { type: 'FCFS', mintPhase: 'Phase 2' },
  'Test Catlist Role': { type: 'FCFS', mintPhase: 'Phase 2' },
  'Game Champion': { type: 'FCFS', mintPhase: 'Phase 2' },
  'Whisker Initiate': { type: 'FCFS', mintPhase: 'Phase 2' },
};

const ROLE_HIERARCHY = [
  'Catcents Legend',
  'Mythic Pouncer',
  'Furion Elite',
  'Shadow Stalker',
  'Alley Alpha',
  'Yarn Master',
  'Pawthfinder',
  'OG Cat',
  'Early Kitten',
  'Monad Veteran',
  'Active Paw',
  'Claw Collector',
  'Purrfect Mod',
  'Community Manager',
  'Meow Mavens',
  'X-Advocate',
  'Game Champion',
  'Whisker Initiate',
  'Test Catlist Role',
  'Catlist',
];

interface RoleCheckResult {
  hasEligibleRole: boolean;
  roles: string[];
  highestRole: string | null;
}

export async function checkUserRole(userId: string): Promise<RoleCheckResult> {
  const cacheDoc = doc(db, 'roleChecks', userId);
  const cacheSnap = await getDoc(cacheDoc);
  const cacheData = cacheSnap.data();
  const cacheAgeHours = cacheData?.timestamp
    ? (new Date().getTime() - cacheData.timestamp.toDate().getTime()) / 1000 / 60 / 60
    : null;
  if (cacheSnap.exists() && cacheAgeHours && cacheAgeHours < 24) {
    console.log('Using cached role check for user:', userId, cacheData);
    return cacheSnap.data() as RoleCheckResult;
  }

  try {
    const rolesResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/roles`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );
    console.log('Guild roles fetched:', rolesResponse.data.map((r: DiscordRole) => r.name));

    const roleMap = new Map<string, string>();
    rolesResponse.data.forEach((role: DiscordRole) => {
      roleMap.set(role.name, role.id);
    });

    const memberResponse = await axios.get(
      `https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      }
    );

    const member = memberResponse.data;
    console.log('Member roles for user', userId, ':', member.roles);

    const userRoles = member.roles
      .map((roleId: string) => {
        const role = rolesResponse.data.find((r: DiscordRole) => r.id === roleId);
        return role && ROLE_PROPERTIES[role.name] ? role.name : null;
      })
      .filter((name: string | null) => name !== null) as string[];

    const hasEligibleRole = userRoles.length > 0;
    console.log(`User ${userId} has eligible role: ${hasEligibleRole}, roles: ${userRoles.join(', ')}`);

    const highestRole = userRoles.length
      ? ROLE_HIERARCHY.find((role) => userRoles.includes(role)) || null
      : null;

    const result = { hasEligibleRole, roles: userRoles, highestRole };
    await setDoc(cacheDoc, { ...result, timestamp: new Date() });
    console.log('Saved role check to cache:', result);

    return result;
  } catch (err: unknown) {
    console.error('Error checking user role:', err instanceof Error ? err.message : err);
    if (err instanceof Error && err.message.includes('404')) {
      console.log(`User ${userId} not found in guild`);
      return { hasEligibleRole: false, roles: [], highestRole: null };
    }
    throw err;
  }
}

export function getRoleProperties(role: string) {
  return ROLE_PROPERTIES[role] || { type: 'Unknown', mintPhase: 'None' };
}