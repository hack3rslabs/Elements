import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(req: Request, { params }: { params: Promise<{ productId: string }> }) {
    try {
        const { productId } = await params;
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        
        const wishlist = userId ? 
            await prisma!.wishlist.findUnique({ where: { userId } }) :
            await prisma!.wishlist.findUnique({ where: { sessionId } });

        if (!wishlist) return NextResponse.json({ success: false }, { status: 404 });

        await prisma!.wishlistItem.delete({
            where: { wishlistId_productId: { wishlistId: wishlist.id, productId } }
        });

        return NextResponse.json({ success: true });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, message: (e as Error).message }, { status: 500 });
    }
}

