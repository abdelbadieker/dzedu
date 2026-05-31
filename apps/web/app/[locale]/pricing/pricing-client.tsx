'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

const plans = [
  {
    id: 'MONTHLY' as const,
    name: 'Monthly',
    price: '1,500',
    currency: 'DA',
    period: '/month',
    features: [
      'Access to all courses',
      'HD video streaming',
      'Progress tracking',
      'Certificate on completion',
      'Priority support',
    ],
  },
  {
    id: 'YEARLY' as const,
    name: 'Yearly',
    price: '12,000',
    currency: 'DA',
    period: '/year',
    popular: true,
    features: [
      'Everything in Monthly',
      '2 months free',
      'Offline downloads',
      'Family sharing (up to 3)',
      'Premium support',
    ],
  },
  {
    id: 'LIFETIME' as const,
    name: 'Lifetime',
    price: '25,000',
    currency: 'DA',
    period: '/once',
    features: [
      'Everything in Yearly',
      'No recurring payments',
      'All future content',
      'Priority feature requests',
      'Direct mentor access',
    ],
  },
];

interface Props {
  userId: string | null;
  locale: string;
}

export default function PricingClient({ userId, locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubscribe = async (planId: string) => {
    if (!userId) {
      router.push(`/${locale}/login`);
      return;
    }

    setLoading(planId);
    setError('');

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        router.refresh();
      } else {
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Failed to create subscription');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="mt-4 text-lg text-muted-foreground">Unlock unlimited learning with DzEdu</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border bg-card p-8 shadow-sm transition-shadow hover:shadow-md ${
              plan.popular ? 'border-primary ring-2 ring-primary' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                Most Popular
              </div>
            )}

            <h3 className="mb-2 text-xl font-bold">{plan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground"> {plan.currency}{plan.period}</span>
            </div>

            <ul className="mb-8 space-y-3">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading === plan.id}
              className={`w-full rounded-lg px-4 py-3 text-sm font-medium ${
                plan.popular
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border bg-background hover:bg-muted'
              } disabled:opacity-50`}
            >
              {loading === plan.id ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-6 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
