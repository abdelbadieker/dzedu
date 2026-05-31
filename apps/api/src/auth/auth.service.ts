import { Injectable, ConflictException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { hash, genSalt, compare } from 'bcryptjs';
import { prisma } from '@dzedu/database';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  generateOtp(): string {
    return randomInt(100_000, 999_999).toString();
  }

  hashOtp(otp: string): string {
    const secret = process.env.OTP_SECRET ?? 'default-otp-secret-change-me';
    return createHash('sha256').update(`${otp}:${secret}`).digest('hex');
  }

  verifyOtpHash(otp: string, storedHash: string): boolean {
    const computedHash = this.hashOtp(otp);
    if (computedHash.length !== storedHash.length) return false;
    try {
      return timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
    } catch {
      return false;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await genSalt(12);
    return hash(password, salt);
  }

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    language?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        language: dto.language ?? 'fr',
        isEmailVerified: false,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
    });

    const otp = this.generateOtp();
    const otpHash = this.hashOtp(otp);

    await prisma.otpVerification.create({
      data: {
        userId: user.id,
        otpHash,
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await this.emailService.sendOtp(dto.email, otp);

    return { userId: user.id, message: 'Compte créé. Code de vérification envoyé.' };
  }

  async verifyOtp(userId: string, otp: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isEmailVerified: true },
    });

    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    if (user.isEmailVerified) return { message: 'Email déjà vérifié' };

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
      throw new UnauthorizedException('Code expiré. Demandez un nouveau code.');
    }

    if (otpRecord.attempts >= 5) {
      throw new HttpException('Trop de tentatives.', HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!this.verifyOtpHash(otp, otpRecord.otpHash)) {
      await prisma.otpVerification.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Code incorrect.');
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

    return { message: 'Email vérifié avec succès.' };
  }
}
