import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  return NextResponse.redirect(`${baseUrl}/`);
}