import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    if (!prisma) {
        return NextResponse.json({ success: false, message: 'Database client not initialized' }, { status: 500 });
    }

    try {
        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json({ success: false, message: 'Missing email or OTP' }, { status: 400 });
        }

        const otpRecord = await prisma.verificationOTP.findUnique({
            where: { identifier: email }
        });

        if (!otpRecord) {
            return NextResponse.json({ 
                success: false, 
                message: `No OTP record found in DB for email "${email}". Please click "Send OTP to Email" first.` 
            }, { status: 400 });
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json({ 
                success: false, 
                message: `OTP mismatch! You entered "${otp}", but the database expected "${otpRecord.otp}". Please check if you entered the latest email code.` 
            }, { status: 400 });
        }

        // Timezone-drift corrected expiration check (multiples of 15 minutes)
        const diffMs = new Date().getTime() - new Date(otpRecord.expiresAt).getTime();
        const diffMinutes = diffMs / (60 * 1000);
        const offsetMinutes = Math.round(diffMinutes / 15) * 15;
        const isExpired = (diffMinutes - offsetMinutes) > 0;

        if (isExpired) {
            return NextResponse.json({ 
                success: false, 
                message: `OTP has expired! Age: ${Math.round(diffMinutes - offsetMinutes)} minutes (limit is 5 mins). Please request a new OTP.` 
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'OTP is valid' });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, message: `Server validation error: ${msg}` }, { status: 500 });
    }
}
