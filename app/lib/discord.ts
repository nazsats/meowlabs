export const ROLE_PROPERTIES: Record<string, { displayName: string; color: string; eligibility: 'GTD' | 'FCFS' | 'none' }> = {
  '1360213933314674818': { displayName: 'Community Manager', color: '#FF0000', eligibility: 'GTD' },
  '1271757759787958282': { displayName: 'Purrfect Mod', color: '#FF4500', eligibility: 'GTD' },
  '1271065450054418564': { displayName: 'Meow Maven', color: '#FFA500', eligibility: 'GTD' },
  '1272820953172152351': { displayName: 'OG', color: '#FFD700', eligibility: 'GTD' },
  '1272821145519001620': { displayName: 'X Advocate', color: '#00FF00', eligibility: 'GTD' },
  '1271757404945649664': { displayName: 'Active Paw', color: '#00FA9A', eligibility: 'GTD' },
  '1366405819423395864': { displayName: 'Furion Elite', color: '#00CED1', eligibility: 'GTD' },
  '1366405821206102046': { displayName: 'Mythic Pouncer', color: '#1E90FF', eligibility: 'GTD' },
  '1366405823080693860': { displayName: 'Catcents Legend', color: '#0000FF', eligibility: 'GTD' },
  '1394315298550579240': { displayName: 'Meowgaverse OG', color: '#800080', eligibility: 'GTD' },
  '1394315521922568326': { displayName: 'Prime Pouncer', color: '#9932CC', eligibility: 'GTD' },
  '1394315707856060418': { displayName: 'Big Whisker', color: '#BA55D3', eligibility: 'FCFS' },
  '1394315844116545637': { displayName: 'Solo Purr', color: '#C71585', eligibility: 'FCFS' },
  '1272887925683785808': { displayName: 'Monad Veteran', color: '#FF6347', eligibility: 'FCFS' },
  '1271757159138463745': { displayName: 'Early Kitten', color: '#FF69B4', eligibility: 'FCFS' },
  '1273248297988919307': { displayName: 'Catlist', color: '#FF1493', eligibility: 'FCFS' },
  '1372582503407157368': { displayName: 'Test Catlist Role', color: '#DB7093', eligibility: 'FCFS' },
  '1272821525397114922': { displayName: 'Game Champion', color: '#DC143C', eligibility: 'FCFS' },
  '1272821417674805280': { displayName: 'Meow Artist', color: '#B22222', eligibility: 'FCFS' },
  '1272821342495838268': { displayName: 'Meow Maestro', color: '#8B0000', eligibility: 'FCFS' },
  '1366405807398326324': { displayName: 'Whisker Initiate', color: '#A52A2A', eligibility: 'FCFS' },
  '1366405809717772308': { displayName: 'Pawthfinder', color: '#CD5C5C', eligibility: 'FCFS' },
  '1366405811508744323': { displayName: 'Claw Collector', color: '#F08080', eligibility: 'FCFS' },
  '1366405813190525008': { displayName: 'Yarn Master', color: '#FA8072', eligibility: 'FCFS' },
  '1366405815149396018': { displayName: 'Alley Alpha', color: '#E9967A', eligibility: 'FCFS' },
  '1366405817263460393': { displayName: 'Shadow Stalker', color: '#FFA07A', eligibility: 'FCFS' },
};

export const ELIGIBLE_ROLES = Object.keys(ROLE_PROPERTIES);

export const ROLE_HIERARCHY = [
  '1360213933314674818', // Community Manager
  '1271757759787958282', // Purrfect Mod
  '1271065450054418564', // Meow Maven
  '1272820953172152351', // OG
  '1272821145519001620', // X Advocate
  '1271757404945649664', // Active Paw
  '1366405819423395864', // Furion Elite
  '1366405821206102046', // Mythic Pouncer
  '1366405823080693860', // Catcents Legend
  '1394315298550579240', // Meowgaverse OG
  '1394315521922568326', // Prime Pouncer
  '1394315707856060418', // Big Whisker
  '1394315844116545637', // Solo Purr
  '1272887925683785808', // Monad Veteran
  '1271757159138463745', // Early Kitten
  '1273248297988919307', // Catlist
  '1372582503407157368', // Test Catlist Role
  '1272821525397114922', // Game Champion
  '1272821417674805280', // Meow Artist
  '1272821342495838268', // Meow Maestro
  '1366405807398326324', // Whisker Initiate
  '1366405809717772308', // Pawthfinder
  '1366405811508744323', // Claw Collector
  '1366405813190525008', // Yarn Master
  '1366405815149396018', // Alley Alpha
  '1366405817263460393', // Shadow Stalker
];

export const GTD_ROLES = [
  'Community Manager',
  'Purrfect Mod',
  'Meow Maven',
  'OG',
  'X Advocate',
  'Active Paw',
  'Furion Elite',
  'Mythic Pouncer',
  'Catcents Legend',
  'Meowgaverse OG',
  'Prime Pouncer',
];

export function getEligibilityMessage(highestRoleId: string | null): string {
  if (!highestRoleId) {
    return "You're not eligible for a mainnet mint. Join our Discord & vibe: https://discord.com/invite/TXPbt7ztMC";
  }
  const roleName = ROLE_PROPERTIES[highestRoleId]?.displayName;
  const eligibility = ROLE_PROPERTIES[highestRoleId]?.eligibility;
  if (eligibility === 'GTD') {
    return `You're eligible for a GTD mint on the mainnet with role: ${roleName}.`;
  } else if (eligibility === 'FCFS') {
    return `You're eligible for a FCFS mint on the mainnet with role: ${roleName}.`;
  }
  return "You're not eligible for a mainnet mint. Join our Discord & vibe: https://discord.com/invite/TXPbt7ztMC";
}