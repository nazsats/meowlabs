import axios, { AxiosError } from 'axios';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface DiscordRole {
  id: string;
  name: string;
}

interface RoleProperty {
  displayName: string;
  type: 'GTD' | 'FCFS';
  mintPhase: string;
}

// Use role IDs as keys, store display names for UI
export const ROLE_PROPERTIES: Record<string, RoleProperty> = {
  '1271065450054418564': { displayName: 'Meow Mavens', type: 'GTD', mintPhase: 'Phase 1' },
  '1360213933314674818': { displayName: 'Community Manager', type: 'GTD', mintPhase: 'Phase 1' },
  '1271757759787958282': { displayName: 'Purrfect Mod', type: 'GTD', mintPhase: 'Phase 1' },
  '1272820953172152351': { displayName: 'OG Cat', type: 'GTD', mintPhase: 'Phase 1' },
  '1272821145519001620': { displayName: 'X-Advocate', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405811508744323': { displayName: 'Claw Collector', type: 'GTD', mintPhase: 'Phase 1' },
  '1271757404945649664': { displayName: 'Active Paw', type: 'GTD', mintPhase: 'Phase 1' },
  '1272887925683785808': { displayName: 'Monad Veteran', type: 'GTD', mintPhase: 'Phase 1' },
  '1271757159138463745': { displayName: 'Early Kitten', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405809717772308': { displayName: 'Pawthfinder', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405813190525008': { displayName: 'Yarn Master', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405815149396018': { displayName: 'Alley Alpha', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405817263460393': { displayName: 'Shadow Stalker', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405819423395864': { displayName: 'Furion Elite', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405821206102046': { displayName: 'Mythic Pouncer', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405823080693860': { displayName: 'Catcents Legend', type: 'GTD', mintPhase: 'Phase 1' },
  '1273248297988919307': { displayName: 'Catlist', type: 'FCFS', mintPhase: 'Phase 2' },
  '1372582503407157368': { displayName: 'Test Catlist Role', type: 'FCFS', mintPhase: 'Phase 2' },
  '1272821525397114922': { displayName: 'Game Champion', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405807398326324': { displayName: 'Whisker Initiate', type: 'FCFS', mintPhase: 'Phase 2' },
};

// Role hierarchy based on IDs
export const ROLE_HIERARCHY = [
  '1366405823080693860', // Catcents Legend  
  '1366405821206102046', // Mythic Pouncer
  '1366405819423395864', // Furion Elite  
  '1366405817263460393', // Shadow Stalker
  '1366405815149396018', // Alley Alpha  
  '1366405813190525008', // Yarn Master
  '1366405809717772308', // Pawthfinder  
  '1272820953172152351', // OG
  '1271757159138463745', // Early Kitten  
  '1272887925683785808', // Monad Veteran
  '1271757404945649664', // Active Paw  
  '1366405811508744323', // Claw Collector
  '1271757759787958282', // Purrfect Mod 
  '1360213933314674818', // Community Manager
  '1271065450054418564', // Meow Mavens  
  '1272821145519001620', // X-Advocate
  '1272821525397114922', // Game Champion  
  '1366405807398326324', // Whisker Initiate
  '1372582503407157368', // Test Catlist Role  
  '1273248297988919307', // Catlist
];

export const ELIGIBLE_ROLES = Object.keys(ROLE_PROPERTIES);

interface RoleCheckResult {
  hasEligibleRole: boolean;
  roles: string[]; // Role IDs
  displayRoles: string[]; // Role names for UI
  highestRole: string | null; // Role ID
  highestRoleName: string | null; // Role name for UI
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

export async function checkUserRole(userId: string, forceRefresh = false): Promise<RoleCheckResult> {
  const cacheDoc = doc(db, 'roleChecks', userId);
  const cacheSnap = await getDoc(cacheDoc);
  const cacheData = cacheSnap.data();
  const cacheAgeHours = cacheData?.timestamp
    ? (new Date().getTime() - cacheData.timestamp.toDate().getTime()) / 1000 / 60 / 60
    : null;

  if (!forceRefresh && cacheSnap.exists() && cacheAgeHours && cacheAgeHours < 1) {
    console.log('Using cached role check for user:', userId, cacheData);
    return cacheSnap.data() as RoleCheckResult;
  }

  try {
    const rolesResponse = await retryRequest(() =>
      axios.get(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/roles`, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      })
    );
    console.log('Guild roles fetched:', rolesResponse.data.map((r: DiscordRole) => ({ id: r.id, name: r.name })));

    const roleMap = new Map<string, string>();
    rolesResponse.data.forEach((role: DiscordRole) => {
      roleMap.set(role.id, role.name);
    });

    const memberResponse = await retryRequest(() =>
      axios.get(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${userId}`, {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        },
      })
    );

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

    return result;
  } catch (err: unknown) {
    console.error('Error checking user role:', err instanceof Error ? err.message : err);
    if (err instanceof AxiosError && err.response?.status === 404) {
      console.log(`User ${userId} not found in guild`);
      return { hasEligibleRole: false, roles: [], displayRoles: [], highestRole: null, highestRoleName: null };
    }
    throw new Error(`Failed to check role: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export function getRoleProperties(roleId: string) {
  return ROLE_PROPERTIES[roleId] || { displayName: 'Unknown Role', type: 'Unknown', mintPhase: 'None' };
}