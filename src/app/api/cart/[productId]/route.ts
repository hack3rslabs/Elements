import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req: Request, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        const { quantity } = await req.json();
        
        const cart = userId ? 
            await prisma!.cart.findUnique({ where: { userId } }) :
            await prisma!.cart.findUnique({ where: { sessionId } });

        if (!cart) return NextResponse.json({ success: false }, { status: 404 });

        await prisma!.cartItem.update({
            where: { cartId_productId: { cartId: cart.id, productId } },
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
        
        const cart = userId ? 
            await prisma!.cart.findUnique({ where: { userId } }) :
            await prisma!.cart.findUnique({ where: { sessionId } });

        if (!cart) return NextResponse.json({ success: false }, { status: 404 });

        await prisma!.cartItem.delete({
            where: { cartId_productId: { cartId: cart.id, productId } }
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
    }
}

