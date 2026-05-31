import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('students') };
}

export default async function StudentsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('students')}</h1>
      <p className="text-muted-foreground">Student management will be available here.</p>
    </div>
  );
}
