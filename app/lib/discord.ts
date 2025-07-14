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
  '1366405811508744323': { displayName: 'Claw Collector', type: 'FCFS', mintPhase: 'Phase 2' },
  '1271757404945649664': { displayName: 'Active Paw', type: 'GTD', mintPhase: 'Phase 1' },
  '1272887925683785808': { displayName: 'Monad Veteran', type: 'FCFS', mintPhase: 'Phase 2' },
  '1271757159138463745': { displayName: 'Early Kitten', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405809717772308': { displayName: 'Pawthfinder', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405813190525008': { displayName: 'Yarn Master', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405815149396018': { displayName: 'Alley Alpha', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405817263460393': { displayName: 'Shadow Stalker', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405819423395864': { displayName: 'Furion Elite', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405821206102046': { displayName: 'Mythic Pouncer', type: 'GTD', mintPhase: 'Phase 1' },
  '1366405823080693860': { displayName: 'Catcents Legend', type: 'GTD', mintPhase: 'Phase 1' },
  '1273248297988919307': { displayName: 'Catlist', type: 'FCFS', mintPhase: 'Phase 2' },
  '1372582503407157368': { displayName: 'Test Catlist Role', type: 'FCFS', mintPhase: 'Phase 2' },
  '1272821525397114922': { displayName: 'Game Champion', type: 'FCFS', mintPhase: 'Phase 2' },
  '1366405807398326324': { displayName: 'Whisker Initiate', type: 'FCFS', mintPhase: 'Phase 2' },
  '1394315521922568326': { displayName: 'Prime Pouncer', type: 'GTD', mintPhase: 'Phase 1' },
  '1394315298550579240': { displayName: 'Meowgaverse OG', type: 'GTD', mintPhase: 'Phase 1' },
  '1394315707856060418': { displayName: 'Big Whisker', type: 'FCFS', mintPhase: 'Phase 2' },
  '1394315844116545637': { displayName: 'Solo Purr', type: 'FCFS', mintPhase: 'Phase 2' },
};

// Role hierarchy based on IDs
export const ROLE_HIERARCHY = [
  '1366405823080693860', // Catcents Legend  
  '1366405821206102046', // Mythic Pouncer
  '1394315298550579240', // Meowgaverse OG
  '1394315521922568326', // Prime Pouncer
  '1394315707856060418', // Big Whisker
  '1394315844116545637', // Solo Purr
  '1366405819423395864', // Furion Elite  
  '1366405817263460393', // Shadow Stalker
  '1366405815149396018', // Alley Alpha  
  '1366405813190525008', // Yarn Master
  '1366405809717772308', // Pawthfinder  
  '1272820953172152351', // OG Cat
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
  roles: string[];
  displayRoles: string[];
  highestRole: string | null;
  highestRoleName: string | null;
}

export async function checkUserRole(userId: string, forceRefresh = false): Promise<RoleCheckResult> {
  try {
    const response = await fetch('/api/check-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, forceRefresh }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    const result: RoleCheckResult = await response.json();
    console.log('Role check result:', result);
    return result;
  } catch (err: unknown) {
    console.error('Error checking user role:', {
      message: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    });
    if (err instanceof Error && err.message.includes('404')) {
      console.log(`User ${userId} not found in guild`);
      return { hasEligibleRole: false, roles: [], displayRoles: [], highestRole: null, highestRoleName: null };
    }
    throw new Error(`Failed to check role: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

export function getRoleProperties(roleId: string) {
  return ROLE_PROPERTIES[roleId] || { displayName: 'Unknown Role', type: 'Unknown', mintPhase: 'None' };
}