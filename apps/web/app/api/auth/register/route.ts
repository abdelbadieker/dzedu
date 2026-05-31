import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { z } from 'zod';
import { hashPassword, generateOtp, hashOtp } from '@/lib/auth-utils';
import { sendOtpEmail } from '@/lib/email';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum').max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  language: z.enum(['ar', 'fr', 'en']).default('fr'),
  role: z.enum(['STUDENT', 'PARENT']).default('STUDENT'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName, language, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'EMAIL_EXISTS', message: 'Cet email est déjà utilisé' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        language,
        isEmailVerified: false,
        profile: {
          create: {
            firstName,
            lastName,
          },
        },
      },
    });

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpHash,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json(
      {
        message: 'Compte créé. Un code de vérification a été envoyé par email.',
        userId: user.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}
