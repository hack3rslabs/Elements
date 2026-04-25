import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;

        if (!prisma) return NextResponse.json({ success: false, message: "DB not available" }, { status: 503 });

        let wishlist;
        
        if (userId) {
            const sessionWishlist = await prisma.wishlist.findUnique({ where: { sessionId }, include: { items: true } });
            let userWishlist = await prisma.wishlist.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });

            if (sessionWishlist && sessionWishlist.items.length > 0) {
                if (!userWishlist) {
                    userWishlist = await prisma.wishlist.update({
                        where: { id: sessionWishlist.id },
                        data: { userId, sessionId: null },
                        include: { items: { include: { product: true } } }
                    });
                } else {
                    for (const item of sessionWishlist.items) {
                        const existingItem = await prisma.wishlistItem.findUnique({
                            where: { wishlistId_productId: { wishlistId: userWishlist.id, productId: item.productId } }
                        });
                        if (!existingItem) {
                            await prisma.wishlistItem.create({
                                data: { wishlistId: userWishlist.id, productId: item.productId }
                            });
                        }
                    }
                    await prisma.wishlist.delete({ where: { id: sessionWishlist.id } });
                    userWishlist = await prisma.wishlist.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
                }
            } else if (sessionWishlist && sessionWishlist.items.length === 0) {
                await prisma.wishlist.delete({ where: { id: sessionWishlist.id } });
            }
            wishlist = userWishlist;
        } else {
            wishlist = await prisma.wishlist.findUnique({
                where: { sessionId },
                include: { items: { include: { product: true } } },
            });
        }

        if (!wishlist) {
            return NextResponse.json({ success: true, data: [] });
        }

        return NextResponse.json({
            success: true,
            data: wishlist.items.map(item => item.product)
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const sessionId = req.headers.get("x-session-id") || 'default_session';
        const userId = session?.user?.id || null;
        
        const { productId } = await req.json();

        if (!prisma) return NextResponse.json({ success: false, message: "DB not available" }, { status: 503 });

        let wishlist = userId ? 
            await prisma.wishlist.findUnique({ where: { userId } }) :
            await prisma.wishlist.findUnique({ where: { sessionId } });

        if (!wishlist) {
            wishlist = await prisma.wishlist.create({
                data: {
                    userId,
                    sessionId: userId ? null : sessionId
                }
            });
        }

        // Prevent duplicates
        const existing = await prisma.wishlistItem.findUnique({
            where: { wishlistId_productId: { wishlistId: wishlist.id, productId } }
        });

        if (!existing) {
            await prisma.wishlistItem.create({
                data: { wishlistId: wishlist.id, productId }
            });
        }

        return NextResponse.json({ success: true, message: "Added to wishlist" });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message }, { status: 500 });
    }
}
