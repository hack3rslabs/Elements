import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  if (!prisma) return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });

  try {
    const { phone, otp } = await request.json();
    if (!phone || !otp) return NextResponse.json({ success: false, message: 'Phone and OTP are required' }, { status: 400 });

    const isTestOtp = (otp === '123456' && process.env.NODE_ENV === 'development');
    
    if (!isTestOtp) {
      const record = await prisma.verificationOTP.findUnique({
        where: { phone }
      });

      if (!record || record.otp !== otp || record.expiresAt < new Date()) {
        return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 401 });
      }

      await prisma.verificationOTP.delete({ where: { phone } });
    }

    // Find or create user by phone number
    let user = await prisma.user.findFirst({
      where: { phone }
    });

    if (!user) {
      // Create new user if not found
      user = await prisma.user.create({
        data: {
          name: 'User ' + phone.slice(-4),
          email: `${phone}@elements.com`, // Consistent placeholder email
          phone: phone,
          role: 'USER'
        }
      });
      console.log(`[AUTH] Created new user for phone: ${phone}`);
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions || []
      }
    });
  } catch (error: unknown) {
    console.error('[AUTH] OTP Verify Error:', error);
    const message = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

