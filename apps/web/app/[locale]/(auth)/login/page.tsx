'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      const messages: Record<string, string> = {
        EMAIL_NOT_VERIFIED: 'Veuillez vérifier votre email avant de vous connecter.',
        ACCOUNT_SUSPENDED: 'Votre compte est temporairement suspendu.',
        ACCOUNT_BANNED: 'Votre compte a été banni.',
      };
      setError(messages[result.error] ?? 'Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('login')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              {t('password')}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? t('login') + '...' : t('login')}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <button
          onClick={() => signIn('google', { callbackUrl: `/${locale}/dashboard` })}
          className="w-full rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          {t('loginGoogle')}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <a href={`/${locale}/register`} className="text-primary hover:underline">
            {t('register')}
          </a>
        </p>
      </div>
    </div>
  );
}
