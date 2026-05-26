import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    if (!prisma) {
        return NextResponse.json({ success: false, message: 'Database not initialized' }, { status: 500 });
    }

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        // 1. Verify if user is an Admin or Staff
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF' && user.role !== 'SUB_ADMIN')) {
            return NextResponse.json({ success: false, message: 'Unauthorized: Admin access only' }, { status: 403 });
        }

        // 2. Rate limiting check (e.g., 60 seconds between OTPs)
        const existingOtp = await prisma.verificationOTP.findUnique({
            where: { identifier: email }
        });

        if (existingOtp && (new Date().getTime() - new Date(existingOtp.createdAt).getTime() < 60000)) {
            return NextResponse.json({ success: false, message: 'Please wait 60 seconds before requesting another OTP' }, { status: 429 });
        }

        // 3. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        console.log(`\n=== [AUTH DEBUG] GENERATING OTP FOR ADMIN ===`);
        console.log(`[AUTH DEBUG] Target Email:     "${email}"`);
        console.log(`[AUTH DEBUG] Generated OTP:    "${otp}"`);
        console.log(`[AUTH DEBUG] Expiry Timestamp: ${expiresAt}`);

        // 4. Delete old OTP (if any) and Save New OTP to Database
        console.log(`[AUTH DEBUG] Deleting old OTP records for identifier "${email}"...`);
        const deleteCount = await prisma.verificationOTP.deleteMany({
            where: { identifier: email }
        });
        console.log(`[AUTH DEBUG] Deleted ${deleteCount.count} old record(s).`);

        console.log(`[AUTH DEBUG] Writing new OTP record to database...`);
        const createdRecord = await prisma.verificationOTP.create({
            data: {
                identifier: email,
                otp,
                expiresAt
            }
        });
        console.log(`[AUTH DEBUG] Successfully wrote OTP record: ID="${createdRecord.id}", identifier="${createdRecord.identifier}", otp="${createdRecord.otp}", expiresAt=${createdRecord.expiresAt}`);

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
            from: `"Elements Admin" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your Admin Login OTP - Elements',
            text: `Your one-time password for admin login is: ${otp}. This code will expire in 5 minutes.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
                    <h2 style="color: #1877F2;">Admin Login Verification</h2>
                    <p>Your one-time password for admin access is:</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">${otp}</div>
                    <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`[AUTH] Admin OTP sent to: ${email}`);

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error: unknown) {
        console.error('[AUTH] Admin Send OTP Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
    }
}
