import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!prisma) {
    return new NextResponse('Database connection error', { status: 500 });
  }

  try {
    const fileRecord = await prisma.uploadedFile.findUnique({
      where: { filename }
    });

    if (!fileRecord) {
      return new NextResponse('File not found', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', fileRecord.mimeType);
    headers.set('Content-Length', fileRecord.size.toString());
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(fileRecord.data, {
      status: 200,
      headers
    });
  } catch (error: unknown) {
    console.error('[API] Serve Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
