import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerParam } = await params;
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const provider = providerParam.toLowerCase();
    const body = await request.json() as Record<string, unknown>;
    
    // Check if integration is enabled
    const integration = await prisma.integration.findUnique({ where: { platform: provider } });
    if (integration && !integration.enabled) {
      return NextResponse.json({ success: false, message: 'Integration disabled' }, { status: 403 });
    }

    // Capture Lead Logic (Generic for now, can be specialized per provider)
    let leadData: Record<string, string | null> = {};
    
    if (provider === 'indiamart') {
      leadData = {
        name: String(body.SENDER_NAME || body.name || 'IndiaMart Lead'),
        email: String(body.SENDER_EMAIL || body.email || ''),
        phone: String(body.SENDER_MOBILE || body.phone || ''),
        message: String(body.QUERY_MESSAGE || body.message || ''),
      };
    } else {
      leadData = {
        name: String(body.name || body.customer_name || 'Webhook Lead'),
        email: String(body.email || body.customer_email || ''),
        phone: String(body.phone || body.customer_phone || ''),
        message: String(body.message || body.notes || JSON.stringify(body)),
      };
    }

    const lead = await prisma.cRMLead.create({
      data: {
        name: leadData.name || 'Unknown',
        email: leadData.email || '',
        phone: leadData.phone || '',
        source: provider.toUpperCase(),
        status: 'NEW',
        notes: [{ id: 'webhook', text: `Captured via ${provider} webhook`, type: 'note', createdBy: 'System', createdAt: new Date().toISOString() }],
      }
    });

    // Update integration stats
    await prisma.integration.update({
      where: { platform: provider },
      data: { 
        leadsReceived: { increment: 1 },
        lastSync: new Date(),
        status: 'active'
      }
    }).catch(() => {}); // Ignore if platform not in DB yet

    return NextResponse.json({ success: true, message: 'Lead captured', id: lead.id });
  } catch (error: unknown) {
    console.error(`[Webhook] ${providerParam} Error:`, error);
    return NextResponse.json({ success: false, message: 'Capture failed', error: (error as Error).message }, { status: 500 });
  }
}
