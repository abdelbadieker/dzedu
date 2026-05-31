'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, Globe, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { routing } from '@/i18n/routing';

interface NavbarProps {
  userName: string;
  onMenuClick: () => void;
}

export default function Navbar({ userName, onMenuClick }: NavbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [langOpen, setLangOpen] = useState(false);

  const switchLocale = (nextLocale: string) => {
    startTransition(() => {
      const segments = pathname.split('/').filter(Boolean);
      if (routing.locales.includes(segments[0] as any)) {
        segments[0] = nextLocale;
      } else {
        segments.unshift(nextLocale);
      }
      router.push(`/${segments.join('/')}`);
      setLangOpen(false);
    });
  };

  const otherLocales = routing.locales.filter((l) => l !== locale);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{t(`Locale.${locale}`)}</span>
        </button>

        {langOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border bg-popover p-1 shadow-md">
              {otherLocales.map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  disabled={isPending}
                  className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                >
                  {t(`Locale.${l}`)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="hidden sm:block text-muted-foreground">{userName}</div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      </div>

      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label={t('Auth.logout')}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('Auth.logout')}</span>
        </button>
      </form>
    </header>
  );
}
