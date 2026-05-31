'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function RegisterPage() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          language: locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Une erreur est survenue.');
        setLoading(false);
        return;
      }

      router.push(`/${locale}/verify-otp?userId=${data.userId}`);
    } catch {
      setError('Erreur de connexion au serveur.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('register')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium">
                Prénom
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium">
                Nom
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {t('email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
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
              minLength={8}
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
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
            {loading ? t('register') + '...' : t('register')}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('hasAccount')}{' '}
          <a href={`/${locale}/login`} className="text-primary hover:underline">
            {t('login')}
          </a>
        </p>
      </div>
    </div>
  );
}
