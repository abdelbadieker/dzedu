import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('myProgress') };
}

export default async function ProgressPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('myProgress')}</h1>
      <p className="text-muted-foreground">Learning progress and analytics will be available here.</p>
    </div>
  );
}
