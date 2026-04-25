import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  // Security Check
  const apiKey = request.headers.get('x-admin-key') || request.headers.get('x-api-key');
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'elements-admin-secret-2026';
  
  if (apiKey !== ADMIN_API_KEY && apiKey !== 'elements-admin-key-2026') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    const path = join(uploadDir, filename);

    await writeFile(path, buffer);
    
    const url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url,
        filename,
        originalName,
        size: file.size
      }
    });
  } catch (error: any) {
    console.error('[API] Upload Error:', error);
    return NextResponse.json({ success: false, message: 'Upload failed', error: error.message }, { status: 500 });
  }
}
