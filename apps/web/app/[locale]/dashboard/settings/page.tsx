import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('settings') };
}

export default async function SettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('settings')}</h1>
      <p className="text-muted-foreground">Account and platform settings will be available here.</p>
    </div>
  );
}
