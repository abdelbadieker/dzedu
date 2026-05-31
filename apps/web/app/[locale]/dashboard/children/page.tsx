import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('children') };
}

export default async function ChildrenPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('children')}</h1>
      <p className="text-muted-foreground">Children management and progress tracking will be available here.</p>
    </div>
  );
}
