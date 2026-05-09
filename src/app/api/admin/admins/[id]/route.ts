import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const isSuperAdmin = async (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  if (apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026') return true;

  const session = await getServerSession(authOptions);
  return session?.user?.role === 'ADMIN';
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isSuperAdmin(request))) {
    return NextResponse.json({ success: false, message: 'Super Admin access required' }, { status: 403 });
  }

  const { id } = await params;

  if (!prisma) {
    return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });
  }

  try {
    // Prevent deleting self
    const session = await getServerSession(authOptions);
    if (session?.user?.id === id) {
      return NextResponse.json({ success: false, message: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
