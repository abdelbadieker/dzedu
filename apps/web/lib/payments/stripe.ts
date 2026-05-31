import Stripe from 'stripe';

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export { stripeClient };

export function constructStripeEvent(rawBody: string, signature: string): Stripe.Event {
  return stripeClient.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? '',
  );
}

export async function createCheckoutSession(params: {
  priceId: string;
  userId: string;
  courseId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  return stripeClient.checkout.sessions.create({
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
