import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signBunnyUrl } from '@/lib/video/token';
import { z } from 'zod';

const tokenRequestSchema = z.object({
  videoPath: z.string().min(1).max(500),
  expiresInSeconds: z.number().int().min(60).max(86400).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = tokenRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { videoPath, expiresInSeconds } = parsed.data;

    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? '0.0.0.0';

    const result = signBunnyUrl(videoPath, userIp, expiresInSeconds);

    return NextResponse.json({
      signedUrl: result.signedUrl,
      expiresAt: result.expiresAt,
      token: result.token,
    });
  } catch (error) {
    console.error('Video token error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
