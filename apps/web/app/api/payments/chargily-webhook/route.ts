import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { verifyChargilySignature } from '@/lib/payments/chargily';
import { chargilyWebhookSchema } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-chargily-signature');

    if (!verifyChargilySignature(rawBody, signature)) {
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
    }

    const parsed = chargilyWebhookSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
    }

    const event = parsed.data;
    const { data } = event;

    if (event.type !== 'invoice.paid') {
      return NextResponse.json({ received: true });
    }

    const { metadata } = data;
    if (!metadata?.userId) {
      return NextResponse.json({ error: 'MISSING_METADATA' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const invoiceNumber = metadata.invoiceNumber ?? `CHARGILY-${Date.now()}`;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (existingInvoice) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: metadata.userId,
          courseId: metadata.courseId ?? null,
          amount: data.amount / 100,
          currency: data.currency ?? 'DZD',
          paymentMethod: data.payment_method === 'edahabia' ? 'CHARGILY_EDAHABIA' : 'CHARGILY_CIB',
          paymentMethodDetail: data.payment_method,
          status: 'PAID',
          chargilyPaymentIntentId: data.id,
          chargilyWebhookData: JSON.parse(JSON.stringify(data)),
          paidAt: new Date(),
        },
      });

      if (metadata.courseId) {
        const existingEnrollment = await tx.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: metadata.userId,
              courseId: metadata.courseId,
            },
          },
        });

        if (!existingEnrollment) {
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Chargily webhook error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
