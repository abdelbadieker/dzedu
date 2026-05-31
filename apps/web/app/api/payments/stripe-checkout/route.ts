import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { createCheckoutSession } from '@/lib/payments/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, priceId, courseId, successUrl, cancelUrl } = body;

    if (!userId || !priceId || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'userId, priceId, successUrl, cancelUrl requis' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const session = await createCheckoutSession({
      priceId,
      userId,
      courseId,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur de création de session de paiement' },
      { status: 500 },
    );
  }
}
