import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    if (!prisma) {
        return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
    }

    try {
        const { email: rawEmail, otp, newPassword } = await request.json();
        const email = rawEmail?.trim().toLowerCase();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
        }

        // 1. Verify OTP
        const otpRecord = await prisma.verificationOTP.findUnique({
            where: { identifier: email }
        });

        if (!otpRecord || otpRecord.otp !== otp) {
            return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });
        }

        if (otpRecord.expiresAt < new Date()) {
            return NextResponse.json({ success: false, message: 'Verification code has expired' }, { status: 400 });
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update User Password
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });

        // 4. Delete OTP record
        await prisma.verificationOTP.delete({
            where: { identifier: email }
        });

        console.log(`[AUTH] Password reset successful for: ${email}`);

        return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error: unknown) {
        console.error('[AUTH] Password Reset Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to reset password' }, { status: 500 });
    }
}
