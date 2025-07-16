import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = NextResponse.redirect(BASE_URL);
    response.cookies.delete('session');
    console.log('User session cleared');
    return response;
  } catch (error: unknown) {
    console.error('Error in /api/auth/logout:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: `Failed to sign out: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}