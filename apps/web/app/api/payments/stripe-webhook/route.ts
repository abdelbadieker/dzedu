import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { constructStripeEvent } from '@/lib/payments/stripe';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'MISSING_SIGNATURE' }, { status: 401 });
    }

    const event = constructStripeEvent(rawBody, signature);
    const obj = event.data.object as any;
    const metadata = (obj.metadata ?? {}) as Record<string, string | undefined>;
    const userId = metadata.userId;

    if (!userId) {
      return NextResponse.json({ error: 'MISSING_METADATA' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const invoiceNumber = `STRIPE-${session.id}`;
        const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
        if (existing) break;

        const paymentIntent =
          typeof session.payment_intent === 'string' ? session.payment_intent : null;

        const courseId = metadata.courseId ?? null;

        await prisma.$transaction(async (tx) => {
          await tx.invoice.create({
            data: {
              invoiceNumber,
              userId,
              courseId,
              amount: (session.amount_total ?? 0) / 100,
              currency: session.currency?.toUpperCase() ?? 'USD',
              paymentMethod: 'STRIPE',
              status: 'PAID',
              stripePaymentIntentId: paymentIntent,
              stripeWebhookData: JSON.parse(JSON.stringify(session)),
              paidAt: new Date(),
            },
          });

          if (courseId) {
            const enrollment = await tx.enrollment.findUnique({
              where: { userId_courseId: { userId, courseId } },
            });
            if (!enrollment) {
              await tx.enrollment.create({
                data: { userId, courseId, status: 'ACTIVE' },
              });
            }
          }
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const periodEnd = (invoice as any).current_period_end;
        if (periodEnd) {
          await prisma.subscription.upsert({
            where: { userId_plan: { userId, plan: 'MONTHLY' } },
            update: {
              status: 'ACTIVE',
              endDate: new Date(periodEnd * 1000),
              stripeSubscriptionId:
                typeof (invoice as any).subscription === 'string'
                  ? (invoice as any).subscription
                  : undefined,
            },
            create: {
              userId,
              plan: 'MONTHLY',
              status: 'ACTIVE',
              startDate: new Date(),
              endDate: new Date(periodEnd * 1000),
              stripeSubscriptionId:
                typeof (invoice as any).subscription === 'string'
                  ? (invoice as any).subscription
                  : undefined,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const deletedSub = event.data.object as any;
        await prisma.subscription.updateMany({
          where: { userId, stripeSubscriptionId: deletedSub.id },
          data: { status: 'CANCELLED', cancelledAt: new Date() },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
