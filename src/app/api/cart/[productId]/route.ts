import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        const { quantity, color = "" } = await req.json();
        
        const cart = userId ? 
            await prisma!.cart.findUnique({ where: { userId } }) :
            await prisma!.cart.findUnique({ where: { sessionId } });

        if (!cart) return NextResponse.json({ success: false }, { status: 404 });

        await prisma!.cartItem.update({
            where: {
                cartId_productId_color: {
                    cartId: cart.id,
                    productId,
                    color: color ? String(color) : ""
                }
            },
            data: { quantity }
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        
        const { searchParams } = new URL(req.url);
        const color = searchParams.get("color") || "";

        const cart = userId ? 
            await prisma!.cart.findUnique({ where: { userId } }) :
            await prisma!.cart.findUnique({ where: { sessionId } });

        if (!cart) return NextResponse.json({ success: false }, { status: 404 });

        await prisma!.cartItem.delete({
            where: {
                cartId_productId_color: {
                    cartId: cart.id,
                    productId,
                    color: color ? String(color) : ""
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
    }
}
