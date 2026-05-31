import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@dzedu/database';

@Injectable()
export class ChargilyService {
  private readonly webhookSecret = process.env.CHARGILY_WEBHOOK_SECRET ?? '';

  verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader || !this.webhookSecret) return false;

    const expectedSig = createHmac('sha256', this.webhookSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    try {
      const expected = Buffer.from(expectedSig, 'utf8');
      const actual = Buffer.from(signatureHeader, 'utf8');
      if (expected.length !== actual.length) return false;
      return timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }

  async handleInvoicePaid(data: any) {
    const metadata = data.metadata;
    if (!metadata?.userId) {
      throw new Error('MISSING_USER_METADATA');
    }

    const invoiceNumber = metadata.invoiceNumber ?? `CHARGILY-${Date.now()}`;
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (existing) return { duplicate: true };

    await prisma.$transaction(async (tx) => {
      await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: metadata.userId,
          courseId: metadata.courseId ?? null,
          amount: data.amount / 100,
          currency: data.currency ?? 'DZD',
          paymentMethod: data.payment_method === 'edahabia' ? 'CHARGILY_EDAHABIA' : 'CHARGILY_CIB',
          status: 'PAID',
          chargilyPaymentIntentId: data.id,
          chargilyWebhookData: data,
          paidAt: new Date(),
        },
      });

      if (metadata.courseId) {
        const enrollment = await tx.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: metadata.userId,
              courseId: metadata.courseId,
            },
          },
        });
        if (!enrollment) {
          await tx.enrollment.create({
            data: {
              userId: metadata.userId,
              courseId: metadata.courseId,
              status: 'ACTIVE',
            },
          });
        }
      }
    });

    return { received: true };
  }
}
