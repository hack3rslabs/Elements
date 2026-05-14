import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { razorpay } from "@/lib/razorpay";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    let body;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: true, message: "Unauthorized" }, { status: 401 });
        }

        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 });
        }

        const {
            items,
            subtotal,
            gst,
            shipping,
            total,
            customerName,
            email,
            phone,
            address,
            pincode,
            area,
            city,
            state,
            billingAddress,
            gstin,
            paymentMethod,
            transportChoice
        } = body;

        if (!prisma) {
            return NextResponse.json({ success: false, message: "Database connection failed" }, { status: 500 });
        }

        // 1. Create Order in our Database (PENDING)
        const order = await prisma.order.create({
            data: {
                userId: session.user.id,
                total: new Prisma.Decimal(total || 0),
                subtotal: new Prisma.Decimal(subtotal || 0),
                gst: new Prisma.Decimal(gst || 0),
                shipping: new Prisma.Decimal(shipping || 0),
                status: "PENDING",
                customerName: String(customerName || ""),
                email: String(email || ""),
                phone: String(phone || ""),
                address: String(address || ""),
                pincode: String(pincode || ""),
                area: area ? String(area) : null,
                city: String(city || ""),
                state: String(state || ""),
                billingAddress: billingAddress ? String(billingAddress) : null,
                gstin: gstin ? String(gstin) : null,
                paymentMethod: String(paymentMethod || "ONLINE"),
                transportChoice: String(transportChoice || "standard"),
                items: {
                    create: (items || []).map((item: { productId: string; quantity: number; product?: { price: number; name: string } }) => ({
                        productId: String(item.productId),
                        quantity: Number(item.quantity) || 1,
                        price: new Prisma.Decimal(item.product?.price || 0),
                        name: String(item.product?.name || "Product")
                    }))
                }
            }
        });

        // 2. If ONLINE payment, create Razorpay Order
        if (paymentMethod === "ONLINE") {
            const amountInPaise = Math.round(Number(total) * 100);
            if (amountInPaise <= 0) {
                return NextResponse.json({ success: false, message: "Invalid order amount for online payment" }, { status: 400 });
            }

            try {
                const razorpayOrder = await razorpay.orders.create({
                    amount: amountInPaise,
                    currency: "INR",
                    receipt: order.id,
                });

                // Update local order with Razorpay Order ID
                await prisma.order.update({
                    where: { id: order.id },
                    data: { razorpayOrderId: razorpayOrder.id }
                });

                return NextResponse.json({
                    success: true,
                    orderId: order.id,
                    razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID
                });
            } catch (rzpError: unknown) {
                const error = rzpError as Error;
                console.error("Razorpay API Error:", error);
                return NextResponse.json({ 
                    success: false, 
                    message: "Razorpay initialization failed. Please check your API keys.",
                    details: error.message
                }, { status: 500 });
            }
        }

        // 3. For other methods (e.g. COD)
        return NextResponse.json({
            success: true,
            orderId: order.id,
            message: "Order placed successfully"
        });

    } catch (err: unknown) {
        const error = err as { 
            message: string; 
            code?: string; 
            meta?: Record<string, unknown>; 
            stack?: string 
        };
        console.error("Fatal Order Error:", error);
        
        // Manual extraction of Prisma error info since it's not JSON-serializable by default
        const errorInfo = {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        };

        return NextResponse.json({ 
            success: false, 
            message: error.message || "An unexpected error occurred while creating your order.",
            details: errorInfo
        }, { status: 500 });
    }
}
