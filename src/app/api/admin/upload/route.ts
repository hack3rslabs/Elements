import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  // Security Check
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  
  if (apiKey !== ADMIN_API_KEY && apiKey !== 'elements-admin-key-2026') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }

  if (!prisma) {
    return NextResponse.json({ success: false, message: 'Database connection error' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const extension = originalName.split('.').pop() || 'jpg';
    const filename = `${uuidv4()}.${extension}`;
    const mimeType = file.type || 'image/jpeg';

    const uploaded = await prisma.uploadedFile.create({
      data: {
        filename,
        originalName,
        mimeType,
        data: buffer,
        size: file.size
      }
    });
    
    const url = `/api/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url,
        filename,
        originalName,
        size: uploaded.size
      }
    });
  } catch (error: unknown) {
    console.error('[API] Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed', error: (error as Error).message }, { status: 500 });
  }
}


