export const ROLE_PROPERTIES: Record<string, { displayName: string; eligibility: string; mintPhase: string }> = {
  '1271065450054418564': { displayName: 'Meow Maven', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1272820953172152351': { displayName: 'OG', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1272821145519001620': { displayName: 'X Advocate', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1366405823080693860': { displayName: 'Catcents Legend', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1366405821206102046': { displayName: 'Mythic Pouncer', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1271757404945649664': { displayName: 'Active Paw', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1394315521922568326': { displayName: 'Prime Pouncer', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1394315298550579240': { displayName: 'Meowgaberse OG', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1270790896396275813': { displayName: 'Community Manager', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1270790896396275814': { displayName: 'Purrfect Mod', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1270790896396275815': { displayName: 'Furion Elite', eligibility: 'GTD', mintPhase: 'Mainnet' },
  '1270790896396275816': { displayName: 'Monad Veteran', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275817': { displayName: 'Early Kitten', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275818': { displayName: 'Catlist', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275819': { displayName: 'Test Catlist Role', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275820': { displayName: 'Game Champion', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275821': { displayName: 'Meow Artist', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275822': { displayName: 'Meow Maestro', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275823': { displayName: 'Whisker Initiate', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275824': { displayName: 'Pawthfinder', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275825': { displayName: 'Claw Collector', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275826': { displayName: 'Yarn Master', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275827': { displayName: 'Alley Alpha', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1270790896396275828': { displayName: 'Shadow Stalker', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1394315707856060418': { displayName: 'Big Whisker', eligibility: 'FCFS', mintPhase: 'Mainnet' },
  '1394315844116545637': { displayName: 'Solo Purr', eligibility: 'FCFS', mintPhase: 'Mainnet' },
};

export const ROLE_HIERARCHY: string[] = [
  '1270790896396275813', // Community Manager
  '1270790896396275814', // Purrfect Mod
  '1271065450054418564', // Meow Maven
  '1272820953172152351', // OG
  '1272821145519001620', // X Advocate
  '1271757404945649664', // Active Paw
  '1270790896396275815', // Furion Elite
  '1366405821206102046', // Mythic Pouncer
  '1366405823080693860', // Catcents Legend
  '1394315298550579240', // Meowgaberse OG
  '1394315521922568326', // Prime Pouncer
  '1270790896396275816', // Monad Veteran
  '1270790896396275817', // Early Kitten
  '1270790896396275818', // Catlist
  '1270790896396275819', // Test Catlist Role
  '1270790896396275820', // Game Champion
  '1270790896396275821', // Meow Artist
  '1270790896396275822', // Meow Maestro
  '1270790896396275823', // Whisker Initiate
  '1270790896396275824', // Pawthfinder
  '1270790896396275825', // Claw Collector
  '1270790896396275826', // Yarn Master
  '1270790896396275827', // Alley Alpha
  '1270790896396275828', // Shadow Stalker
  '1394315707856060418', // Big Whisker
  '1394315844116545637', // Solo Purr
];

export const ELIGIBLE_ROLES: string[] = Object.keys(ROLE_PROPERTIES);

export function getHighestRole(roles: string[]): { role: string | null; eligibility: string | null; mintPhase: string | null; displayName: string | null } {
  for (const roleId of ROLE_HIERARCHY) {
    if (roles.includes(roleId)) {
      return {
        role: roleId,
        eligibility: ROLE_PROPERTIES[roleId]?.eligibility || null,
        mintPhase: ROLE_PROPERTIES[roleId]?.mintPhase || null,
        displayName: ROLE_PROPERTIES[roleId]?.displayName || null,
      };
    }
  }
  return { role: null, eligibility: null, mintPhase: null, displayName: null };
}

export function getEligibilityMessage(roleId: string | null): string {
  if (!roleId || !(roleId in ROLE_PROPERTIES)) {
    return "You're not eligible for a mainnet mint. Join Discord & vibe!";
  }
  const { eligibility, mintPhase, displayName } = ROLE_PROPERTIES[roleId];
  return `${displayName}: You're eligible for a ${eligibility} mint on the ${mintPhase}.`;
}