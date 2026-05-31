'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, Users, Search } from 'lucide-react';
import { useState } from 'react';

interface CourseEntry {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  level: string;
  accessType: string;
  price?: string | null;
  thumbnailUrl?: string | null;
  teacher: { email: string; profile: { firstName: string | null; lastName: string | null } | null };
  _count: { modules: number; enrollments: number };
  createdAt: string;
}

interface Props {
  courses: CourseEntry[];
  locale: string;
}

export default function CourseCatalogClient({ courses, locale }: Props) {
  const t = useTranslations('Courses');
  const tc = useTranslations('Common');
  const [search, setSearch] = useState('');

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tc('search')}
            className="w-64 rounded-lg border bg-background py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          {tc('noResults')}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => {
          const teacherName = course.teacher.profile
            ? `${course.teacher.profile.firstName ?? ''} ${course.teacher.profile.lastName ?? ''}`.trim()
            : course.teacher.email;

          return (
            <Link
              key={course.id}
              href={`/${locale}/courses/${course.id}`}
              className="group rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              {course.thumbnailUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-t-xl bg-muted">
                  <BookOpen className="h-10 w-10 text-muted-foreground" />
                </div>
              )}

              <div className="p-4">
                <h3 className="mb-1 font-semibold group-hover:text-primary">{course.title}</h3>
                {course.shortDescription && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{course.shortDescription}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{t(`levels.${course.level}`)}</span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {course._count.modules}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course._count.enrollments}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>{teacherName}</span>
                  <span className="font-medium text-foreground">
                    {course.accessType === 'FREE' ? 'Free' : course.price ? `${Number(course.price).toFixed(2)} DA` : course.accessType}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
