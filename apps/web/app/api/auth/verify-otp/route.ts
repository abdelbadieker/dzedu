import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { z } from 'zod';
import { verifyOtp } from '@/lib/auth-utils';

const verifyOtpSchema = z.object({
  userId: z.string(),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { userId, otp } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isEmailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: 'Email déjà vérifié' });
    }

    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP_EXPIRED', message: 'Code expiré. Demandez un nouveau code.' },
        { status: 410 },
      );
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json(
        { error: 'OTP_LOCKED', message: 'Trop de tentatives. Demandez un nouveau code.' },
        { status: 429 },
      );
    }

    if (!verifyOtp(otp, otpRecord.otpHash)) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = 4 - otpRecord.attempts;
      return NextResponse.json(
        {
          error: 'OTP_INVALID',
          message: `Code incorrect. Il vous reste ${remaining} tentative(s).`,
          attemptsRemaining: remaining,
        },
        { status: 401 },
      );
    }

    await prisma.$transaction([
      prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      }),
    ]);

    return NextResponse.json({
      message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
