import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('user_id')?.value;

  if (!userId) {
    console.log('No user_id cookie found');
    return NextResponse.json({ userId: null });
  }

  return NextResponse.json({ userId });
}