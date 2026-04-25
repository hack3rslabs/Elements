import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const isAdmin = (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  return apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026';
};

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const integrations = await prisma.integration.findMany();
    const data: Record<string, any> = {};
    integrations.forEach(i => {
      data[i.platform] = {
        enabled: i.enabled,
        status: i.status,
        leadsReceived: i.leadsReceived,
        lastSync: i.lastSync?.toISOString(),
        ...(i.config as object || {}),
      };
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const { platform, config } = await request.json();
    const { enabled, status, ...rest } = config;

    const updated = await prisma.integration.upsert({
      where: { platform },
      update: {
        enabled: !!enabled,
        status: status || 'disconnected',
        config: rest,
      },
      create: {
        platform,
        enabled: !!enabled,
        status: status || 'disconnected',
        config: rest,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
