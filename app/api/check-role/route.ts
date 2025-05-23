import { NextResponse } from 'next/server';
import { checkUserRole } from '../../lib/discord';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const forceRefresh = searchParams.get('forceRefresh') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { hasEligibleRole, roles, displayRoles, highestRole, highestRoleName } = await checkUserRole(userId, forceRefresh);
    console.log('Check-role response for', userId, ':', { hasEligibleRole, roles, displayRoles, highestRole, highestRoleName });
    return NextResponse.json({ hasEligibleRole, roles, displayRoles, highestRole, highestRoleName });
  } catch (error: unknown) {
    console.error('Error checking role:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: `Failed to check role: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}