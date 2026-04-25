import { NextResponse } from 'next/server';

export async function POST() {
  // For now, just acknowledged.
  return NextResponse.json({ success: true });
}

