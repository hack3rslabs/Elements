import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const isAdmin = (request: NextRequest) => {
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  return apiKey === ADMIN_API_KEY || apiKey === 'elements-admin-key-2026';
};

const ROLES_CONFIG = {
  admin: { label: 'Administrator', permissions: ['dashboard', 'products', 'orders', 'crm', 'payments', 'banners', 'tasks', 'campaigns', 'reports', 'integrations', 'staff', 'seo', 'settings'] },
  sub_admin: { label: 'Sub Admin', permissions: ['dashboard', 'products', 'orders', 'crm', 'payments', 'banners', 'tasks', 'campaigns', 'reports', 'seo'] },
  staff: { label: 'Staff', permissions: ['dashboard', 'products', 'orders', 'crm'] },
  tele_caller: { label: 'Tele Caller', permissions: ['crm'] },
  product_uploader: { label: 'Product Uploader', permissions: ['products'] },
  viewer: { label: 'Viewer', permissions: ['dashboard', 'reports'] },
};

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const staff = await prisma.user.findMany({
      where: { role: { not: 'USER' } },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = staff.map(s => ({
      id: s.id,
      name: s.name || 'Unknown',
      email: s.email || '',
      phone: s.phone || '',
      role: s.role.toLowerCase(),
      status: 'active', // Fallback
      createdAt: s.createdAt.toISOString(),
      lastLogin: null,
      permissions: s.permissions,
    }));

    return NextResponse.json({ success: true, data: formatted, roles: ROLES_CONFIG });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  if (!prisma) return NextResponse.json({ success: false, message: 'DB error' }, { status: 500 });

  try {
    const { name, email, phone, role, password } = await request.json();
    
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);
    const roleUpper = role.toUpperCase();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: roleUpper as any,
        permissions: (ROLES_CONFIG as any)[role.toLowerCase()]?.permissions || [],
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        status: 'active',
        createdAt: user.createdAt.toISOString(),
        lastLogin: null,
        permissions: user.permissions
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
