import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendOtp } from '@/lib/backend/otp_delivery';

export async function POST(request: NextRequest) {
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  try {
    const { phone } = await request.json();
    if (!phone) return NextResponse.json({ success: false, message: 'Phone number is required' }, { status: 400 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.verificationOTP.upsert({
      where: { phone },
      update: { otp, expiresAt },
      create: { phone, otp, expiresAt }
    });

    await sendOtp(phone, otp);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('[AUTH] OTP Send Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}

