import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

async function getCart(userId: string | null, sessionId: string) {
    if (!prisma) return null;
    if (userId) {
        const sessionCart = await prisma.cart.findUnique({ where: { sessionId }, include: { items: true } });
        let userCart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });

        if (sessionCart && sessionCart.items.length > 0) {
            if (!userCart) {
                userCart = await prisma.cart.update({
                    where: { id: sessionCart.id },
                    data: { userId, sessionId: null },
                    include: { items: { include: { product: true } } }
                });
            } else {
                for (const item of sessionCart.items) {
                    const existingItem = await prisma.cartItem.findUnique({
                        where: { cartId_productId: { cartId: userCart.id, productId: item.productId } }
                    });
                    if (existingItem) {
                        await prisma.cartItem.update({
                            where: { id: existingItem.id },
                            data: { quantity: existingItem.quantity + item.quantity }
                        });
                    } else {
                        await prisma.cartItem.create({
                            data: { cartId: userCart.id, productId: item.productId, quantity: item.quantity }
                        });
                    }
                }
                await prisma.cart.delete({ where: { id: sessionCart.id } });
                userCart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
            }
        } else if (sessionCart && sessionCart.items.length === 0) {
            await prisma.cart.delete({ where: { id: sessionCart.id } });
        }
        return userCart;
    }
    
    return prisma.cart.findUnique({
        where: { sessionId },
        include: { items: { include: { product: true } } },
    });
}

interface CartItemWithProduct {
    quantity: number;
    product: {
        price: unknown;
        mrp: unknown;
    };
}

function calculateTotals(items: CartItemWithProduct[]) {
    let subtotal = 0;
    let mrpTotal = 0;
    let itemCount = 0;

    items.forEach(item => {
        subtotal += Number(item.product.price) * item.quantity;
        mrpTotal += Number(item.product.mrp) * item.quantity;
        itemCount += item.quantity;
    });

    return {
        items,
        subtotal,
        mrpTotal,
        savings: mrpTotal - subtotal,
        itemCount
    };
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;

        const cart = await getCart(userId, sessionId);

        if (!cart) {
            return NextResponse.json({
                success: true,
                data: { items: [], subtotal: 0, mrpTotal: 0, savings: 0, itemCount: 0 }
            });
        }

        return NextResponse.json({
            success: true,
            data: calculateTotals(cart.items)
        });
    } catch (e: unknown) {
        const error = e as Error;
        console.error("Cart error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        
        const { productId, quantity = 1 } = await req.json();

        if (!prisma) return NextResponse.json({ success: false, message: "DB not available" }, { status: 503 });

        let cart = await getCart(userId, sessionId);

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId,
                    sessionId: userId ? null : sessionId
                },
                include: { items: { include: { product: true } } }
            });
        }

        const existingItem = await prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity }
            });
        }

        return NextResponse.json({ success: true, message: "Added to cart" });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}

