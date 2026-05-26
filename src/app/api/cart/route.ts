import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

async function getCart(userId: string | null, sessionId: string) {
    if (!prisma) return null;
    if (userId) {
        const sessionCart = await prisma.cart.findUnique({ where: { sessionId }, include: { items: true } });
        let userCart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: { include: { category: { include: { parent: true } } } } } } } });

        if (sessionCart && sessionCart.items.length > 0) {
            if (!userCart) {
                userCart = await prisma.cart.update({
                    where: { id: sessionCart.id },
                    data: { userId, sessionId: null },
                    include: { items: { include: { product: { include: { category: { include: { parent: true } } } } } } }
                });
                for (const item of sessionCart.items) {
                    const existingItem = await prisma.cartItem.findUnique({
                        where: {
                            cartId_productId_color: {
                                cartId: userCart.id,
                                productId: item.productId,
                                color: item.color
                            }
                        }
                    });
                    if (existingItem) {
                        await prisma.cartItem.update({
                            where: { id: existingItem.id },
                            data: { quantity: existingItem.quantity + item.quantity }
                        });
                    } else {
                        await prisma.cartItem.create({
                            data: {
                                cartId: userCart.id,
                                productId: item.productId,
                                color: item.color,
                                quantity: item.quantity
                            }
                        });
                    }
                }
                await prisma.cart.delete({ where: { id: sessionCart.id } });
                userCart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: { include: { category: { include: { parent: true } } } } } } } });
            }
        } else if (sessionCart && sessionCart.items.length === 0) {
            await prisma.cart.delete({ where: { id: sessionCart.id } });
        }
        return userCart;
    }
    
    return prisma.cart.findUnique({
        where: { sessionId },
        include: { items: { include: { product: { include: { category: { include: { parent: true } } } } } } },
    });
}

interface CartItemWithProduct {
    quantity: number;
    product: {
        price: unknown;
        mrp: unknown;
        category?: {
            name?: string;
            slug?: string;
            parent?: {
                name?: string;
                slug?: string;
            } | null;
        } | null;
    };
}

import { getGSTPercentage } from "@/lib/api/helpers";

function calculateTotals(items: CartItemWithProduct[]) {
    let subtotal = 0;
    let gstTotal = 0;
    let mrpTotal = 0;
    let itemCount = 0;

    items.forEach(item => {
        const price = Number(item.product.price);
        const qty = item.quantity;
        const gstRate = getGSTPercentage(item.product);
        const itemSubtotal = price * qty;
        const itemGst = (itemSubtotal * gstRate) / 100;

        subtotal += itemSubtotal;
        gstTotal += itemGst;
        mrpTotal += Number(item.product.mrp) * qty;
        itemCount += qty;
    });

    return {
        items,
        subtotal: Math.round(subtotal * 100) / 100,
        gstTotal: Math.round(gstTotal * 100) / 100,
        total: Math.round((subtotal + gstTotal) * 100) / 100,
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
        return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        
        const { productId, quantity = 1, color = "" } = await req.json();

        if (!prisma) return NextResponse.json({ success: false, message: "DB not available" }, { status: 503 });

        let cart = await getCart(userId, sessionId);

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId,
                    sessionId: userId ? null : sessionId
                },
                include: { items: { include: { product: { include: { category: { include: { parent: true } } } } } } }
            });
        }

        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId_color: {
                    cartId: cart.id,
                    productId,
                    color: color ? String(color) : ""
                }
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    color: color ? String(color) : "",
                    quantity
                }
            });
        }

        return NextResponse.json({ success: true, message: "Added to cart" });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
    }
}



