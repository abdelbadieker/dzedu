'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, BookOpen, Wallet, CreditCard, TrendingUp, Loader2, BarChart3 } from 'lucide-react';

interface StatsData {
  users: { total: number; students: number; teachers: number };
  courses: { total: number; published: number };
  enrollments: { total: number; active: number };
  revenue: { total: number; currency: string };
  subscriptions: { active: number };
}

export default function AnalyticsPage() {
  const t = useTranslations('Navigation');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!stats) {
    return <div className="py-20 text-center text-muted-foreground">Failed to load analytics.</div>;
  }

  const sections = [
    {
      title: 'Users',
      icon: Users,
      rows: [
        { label: 'Total', value: stats.users.total },
        { label: 'Students', value: stats.users.students },
        { label: 'Teachers', value: stats.users.teachers },
      ],
    },
    {
      title: 'Courses',
      icon: BookOpen,
      rows: [
        { label: 'Total', value: stats.courses.total },
        { label: 'Published', value: stats.courses.published },
        { label: 'Unpublished', value: stats.courses.total - stats.courses.published },
      ],
    },
    {
      title: 'Enrollments',
      icon: TrendingUp,
      rows: [
        { label: 'Total', value: stats.enrollments.total },
        { label: 'Active', value: stats.enrollments.active },
        { label: 'Inactive', value: stats.enrollments.total - stats.enrollments.active },
      ],
    },
    {
      title: 'Revenue',
      icon: Wallet,
      rows: [
        { label: 'Total Revenue', value: `${stats.revenue.total.toLocaleString()} ${stats.revenue.currency}` },
        { label: 'Active Subscriptions', value: stats.subscriptions.active },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('analytics')}</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>
              <div className="space-y-3">
                {section.rows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">Platform Summary</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.users.total} users · {stats.courses.published} published courses · {stats.enrollments.active} active enrollments · {stats.subscriptions.active} active subscriptions
        </p>
      </div>
    </div>
  );
}
