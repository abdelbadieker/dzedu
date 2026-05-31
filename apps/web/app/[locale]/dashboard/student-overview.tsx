'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Clock, Trophy, TrendingUp } from 'lucide-react';

interface OverviewProps {
  userName: string;
  welcome: string;
}

export default function StudentOverview({ userName, welcome }: OverviewProps) {
  const t = useTranslations('Dashboard');

  const stats = [
    { label: t('stats.enrolledCourses'), value: '0', icon: BookOpen },
    { label: t('stats.completedLessons'), value: '0', icon: Trophy },
    { label: t('stats.hoursWatched'), value: '0h', icon: Clock },
    { label: t('stats.averageScore'), value: '--', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{welcome}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">{t('quickActions')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('myCourses')} — {t('myProgress')}
        </p>
      </div>
    </div>
  );
}
