import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    if (!prisma) {
        return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
    }

    try {
        const { email: rawEmail, otp } = await request.json();
        const email = rawEmail?.trim().toLowerCase();

        if (!email || !otp) {
            return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 });
        }

        const otpRecord = await prisma.verificationOTP.findUnique({
            where: { identifier: email }
        });

        if (!otpRecord || otpRecord.otp !== otp) {
            return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });
        }

        // Timezone-drift corrected expiration check (multiples of 15 minutes)
        const diffMs = new Date().getTime() - new Date(otpRecord.expiresAt).getTime();
        const diffMinutes = diffMs / (60 * 1000);
        const offsetMinutes = Math.round(diffMinutes / 15) * 15;
        const isExpired = (diffMinutes - offsetMinutes) > 0;

        if (isExpired) {
            return NextResponse.json({ success: false, message: 'Verification code has expired' }, { status: 400 });
        }

        console.log(`[AUTH] OTP verified for: ${email}`);
        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[AUTH] OTP Verify Error:', errMsg);
        return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
    }
}
