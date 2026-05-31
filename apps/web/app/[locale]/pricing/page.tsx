import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import PricingClient from './pricing-client';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Common' });
  return { title: 'Pricing' };
}

export default async function PricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();

  return <PricingClient userId={session?.user?.id ?? null} locale={locale} />;
}
