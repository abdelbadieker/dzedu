import { defineRouting } from 'next-intl/routing';

export type Locale = 'ar' | 'fr' | 'en';

export const routing = defineRouting({
  locales: ['ar', 'fr', 'en'] as Locale[],
  defaultLocale: 'fr' as Locale,
  localePrefix: 'as-needed',
  localeDetection: true,
});
