import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        const {
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        } = await req.json();

        if (!prisma) return NextResponse.json({ success: false, message: "Database error" }, { status: 500 });

        // 1. Verify Signature
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpaySignature;

        if (isAuthentic) {
            // 2. Update Order to PAID
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "PAID",
                    razorpayPaymentId,
                    razorpaySignature
                }
            });

            return NextResponse.json({ success: true, message: "Payment verified successfully" });
        } else {
            return NextResponse.json({ success: false, message: "Payment verification failed" }, { status: 400 });
        }

    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
