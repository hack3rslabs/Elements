import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    if (!prisma) {
        return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
    }

    try {
        const { email: rawEmail } = await request.json();
        const email = rawEmail?.trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        // 1. Find user by email
        console.log(`[AUTH] Forgot Password: searching email="${email}"`);
        
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log(`[AUTH] No user found for email="${email}"`);
            return NextResponse.json({ success: false, message: 'No account found. Please register first.' }, { status: 404 });
        }

        console.log(`[AUTH] User found: ${user.id} (email=${user.email})`);

        // 2. If the user's stored email is a placeholder (e.g. 1234567890@elements.com),
        //    update it to the real email they provided

        // 3. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 4. Delete old OTP (if any) and Save New OTP to Database
        await prisma.verificationOTP.deleteMany({
            where: { identifier: email }
        });

        await prisma.verificationOTP.create({
            data: {
                identifier: email,
                otp,
                expiresAt
            }
        });

        // 5. Send Email via SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"Elements Support" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Elements',
            text: `Your one-time password for resetting your password is: ${otp}. This code will expire in 10 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                    <h2 style="color: #1877F2;">Password Reset Verification</h2>
                    <p>You requested to reset your password. Use the following code to proceed:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">${otp}</div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[AUTH] Forgot Password OTP sent to: ${email}`);

        return NextResponse.json({ success: true, message: 'OTP sent to your email' });
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[AUTH] Forgot Password Send OTP Error:', errMsg);
        return NextResponse.json({ success: false, message: `Failed to send OTP: ${errMsg}` }, { status: 500 });
    }
}
