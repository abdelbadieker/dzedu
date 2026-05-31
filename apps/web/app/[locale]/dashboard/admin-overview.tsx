'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, BookOpen, Wallet, CreditCard, TrendingUp, Loader2 } from 'lucide-react';

interface StatsData {
  users: { total: number; students: number; teachers: number };
  courses: { total: number; published: number };
  enrollments: { total: number; active: number };
  revenue: { total: number; currency: string };
  subscriptions: { active: number };
}

export default function AdminOverview() {
  const t = useTranslations('Dashboard');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: t('totalStudents'), value: stats?.users.students ?? 0, icon: Users },
    { label: t('totalCourses'), value: stats?.courses.total ?? 0, icon: BookOpen },
    { label: t('totalRevenue'), value: `${(stats?.revenue.total ?? 0).toLocaleString()} ${stats?.revenue.currency ?? 'DZD'}`, icon: Wallet },
    { label: t('activeSubscriptions'), value: stats?.subscriptions.active ?? 0, icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Enrollments</h2>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-3xl font-bold">{stats?.enrollments.active ?? 0}</span>
            <span className="text-sm text-muted-foreground">/ {stats?.enrollments.total ?? 0} active</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Courses</h2>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-3xl font-bold">{stats?.courses.published ?? 0}</span>
            <span className="text-sm text-muted-foreground">/ {stats?.courses.total ?? 0} published</span>
          </div>
        </div>
      </div>
    </div>
  );
}
