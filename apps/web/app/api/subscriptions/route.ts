import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, EnrollmentStatus, SubscriptionPlan } from '@dzedu/database';

const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
  YEARLY: process.env.STRIPE_PRICE_YEARLY,
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: EnrollmentStatus.ACTIVE,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Subscription get error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { plan } = await request.json();
    if (!plan || !['MONTHLY', 'YEARLY'].includes(plan)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: { plan: 'Must be MONTHLY or YEARLY' } }, { status: 400 });
    }

    const existing = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        plan: plan as SubscriptionPlan,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already subscribed', subscription: existing });
    }

    const priceId = STRIPE_PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 });
    }

    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
      apiVersion: '2025-02-24.acacia' as any,
    });

    const session_ = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: session.user.email ?? undefined,
      client_reference_id: session.user.id,
      metadata: { plan, userId: session.user.id },
      success_url: `${request.headers.get('origin') ?? process.env.NEXTAUTH_URL}/pricing?success=1`,
      cancel_url: `${request.headers.get('origin') ?? process.env.NEXTAUTH_URL}/pricing?cancelled=1`,
    });

    return NextResponse.json({ url: session_.url });
  } catch (error) {
    console.error('Subscription create error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
