'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus, BookOpen, Users, Eye, Pencil } from 'lucide-react';

interface CourseEntry {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  level: string;
  accessType: string;
  thumbnailUrl?: string | null;
  teacher: { email: string; profile: { firstName: string | null; lastName: string | null } | null };
  _count: { modules: number; enrollments: number };
  createdAt: string;
}

interface CourseListClientProps {
  courses: CourseEntry[];
  isTeacher: boolean;
  locale: string;
}

export default function CourseListClient({ courses, isTeacher, locale }: CourseListClientProps) {
  const tnav = useTranslations('Navigation');
  const tc = useTranslations('Common');
  const t = useTranslations('Courses');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tnav('myCourses')}</h1>
        {isTeacher && (
          <Link
            href={`/${locale}/dashboard/courses/new`}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            {tc('create')}
          </Link>
        )}
      </div>

      {courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border py-16">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No courses yet.</p>
          {isTeacher && (
            <Link
              href={`/${locale}/dashboard/courses/new`}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Create your first course
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            {course.thumbnailUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-xs ${
                  course.isPublished
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {t(`levels.${course.level}`)}
                </span>
              </div>

              <h3 className="mb-1 font-semibold">{course.title}</h3>

              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {course._count.modules}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course._count.enrollments}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/${locale}/dashboard/courses/${course.id}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                >
                  <Pencil className="h-4 w-4" />
                  {tc('edit')}
                </Link>
                <Link
                  href={`/${locale}/dashboard/courses/${course.id}/modules`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                >
                  <Eye className="h-4 w-4" />
                  Manage
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
