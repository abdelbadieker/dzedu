import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { prisma } from '@dzedu/database';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }

  constructEvent(rawBody: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    );
  }

  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    courseId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      metadata: {
        userId: params.userId,
        ...(params.courseId ? { courseId: params.courseId } : {}),
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  async handleCheckoutCompleted(session: any) {
    const metadata = session.metadata;
    if (!metadata?.userId) return;

    const invoiceNumber = `STRIPE-${session.id}`;
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (existing) return;

    await prisma.$transaction(async (tx) => {
      await tx.invoice.create({
        data: {
          invoiceNumber,
          userId: metadata.userId,
          courseId: metadata.courseId ?? null,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() ?? 'USD',
          paymentMethod: 'STRIPE',
          status: 'PAID',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          stripeWebhookData: session,
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
  }

  async handleInvoicePaid(data: any) {
    const userId = data.metadata?.userId;
    if (!userId) return;

    await prisma.subscription.upsert({
      where: { userId_plan: { userId, plan: 'MONTHLY' } },
      update: {
        status: 'ACTIVE',
        endDate: new Date(data.current_period_end * 1000),
        stripeSubscriptionId:
          typeof data.subscription === 'string' ? data.subscription : undefined,
      },
      create: {
        userId,
        plan: 'MONTHLY',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(data.current_period_end * 1000),
        stripeSubscriptionId:
          typeof data.subscription === 'string' ? data.subscription : undefined,
      },
    });
  }

  async handleSubscriptionDeleted(data: any) {
    const userId = data.metadata?.userId;
    if (!userId) return;

    await prisma.subscription.updateMany({
      where: {
        userId,
        stripeSubscriptionId: typeof data.id === 'string' ? data.id : undefined,
      },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}
