import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('earnings') };
}

export default async function EarningsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('earnings')}</h1>
      <p className="text-muted-foreground">Earnings reports and payouts will be available here.</p>
    </div>
  );
}
