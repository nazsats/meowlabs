import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value || null;
  console.log('User API - Returning userId:', userId);
  if (userId && !/^\d{17,19}$/.test(userId)) {
    console.log('Invalid userId, clearing cookie:', userId);
    cookieStore.delete('userId');
    return NextResponse.json({ userId: null });
  }
  return NextResponse.json({ userId });
}