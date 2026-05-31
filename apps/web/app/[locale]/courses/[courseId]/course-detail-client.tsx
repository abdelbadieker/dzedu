'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, Clock, Lock, Play, Globe, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

interface LessonEntry {
  id: string;
  title: string;
  sortOrder: number;
  isFree: boolean;
  videoDuration?: number | null;
}

interface ModuleEntry {
  id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
  lessons: LessonEntry[];
}

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  level: string;
  accessType: string;
  price?: string | null;
  thumbnailUrl?: string | null;
  teacher: { id: string; email: string; profile: { firstName: string | null; lastName: string | null } | null };
  modules: ModuleEntry[];
  _count: { enrollments: number };
}

interface Props {
  course: CourseData;
  enrollment: { id: string; status: string; progress: number } | null;
  userId: string | null;
  locale: string;
}

export default function CourseDetailClient({ course, enrollment, userId, locale }: Props) {
  const t = useTranslations('Courses');
  const tc = useTranslations('Common');
  const tnav = useTranslations('Navigation');
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [error, setError] = useState('');

  const isEnrolled = !!enrollment;
  const isOwner = userId === course.teacher.id;
  const totalDuration = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.videoDuration ?? 0), 0),
    0,
  );

  const toggleModule = (id: string) => {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleEnroll = async () => {
    if (!userId) {
      router.push(`/${locale}/login`);
      return;
    }

    setEnrolling(true);
    setError('');

    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      if (data.error === 'PAYMENT_REQUIRED') {
        setError('Payment is required to access this course.');
      } else if (data.error === 'SUBSCRIPTION_REQUIRED') {
        router.push(`/${locale}/pricing`);
        return;
      } else if (data.error === 'ALREADY_ENROLLED') {
        setError('');
        router.refresh();
      } else {
        setError(data.error ?? 'Failed to enroll');
      }
    }

    setEnrolling(false);
  };

  const teacherName = course.teacher.profile
    ? `${course.teacher.profile.firstName ?? ''} ${course.teacher.profile.lastName ?? ''}`.trim()
    : course.teacher.email;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.shortDescription && (
              <p className="mt-2 text-muted-foreground">{course.shortDescription}</p>
            )}
          </div>

          {course.thumbnailUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-xl">
              <img src={course.thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
            </div>
          )}

          {course.description && (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
          )}

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Course Content</h2>
            {course.modules.map((mod) => {
              const open = expandedModules.includes(mod.id);
              return (
                <div key={mod.id} className="rounded-lg border">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="font-medium">{mod.title}</span>
                      <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
                    </div>
                  </button>

                  {open && (
                    <div className="border-t">
                      {mod.lessons.map((lesson) => {
                        const canView = isEnrolled || isOwner || lesson.isFree;
                        return (
                          <div key={lesson.id} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                              {canView ? (
                                <Play className="h-4 w-4 text-primary" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span>{lesson.title}</span>
                              {lesson.isFree && (
                                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                                  Free
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.videoDuration && (
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(lesson.videoDuration / 60)}:{(lesson.videoDuration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                              {canView ? (
                                <Link
                                  href={`/${locale}/courses/${course.id}/lessons/${lesson.id}`}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Watch
                                </Link>
                              ) : (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4 rounded-xl border bg-card p-6">
            {course.price && Number(course.price) > 0 && (
              <div className="text-center">
                <span className="text-3xl font-bold">{Number(course.price).toFixed(2)}</span>
                <span className="text-muted-foreground"> DA</span>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>{t(`levels.${course.level}`)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>{course.modules.length} modules</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>~{Math.floor(totalDuration / 60)} hours</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span>{t(`access.${course.accessType}`)}</span>
              </div>
            </div>

            <button
              onClick={handleEnroll}
              disabled={enrolling || isEnrolled || isOwner}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {enrolling
                ? tc('loading')
                : isEnrolled
                  ? 'Enrolled'
                  : isOwner
                    ? 'Owner'
                    : 'Enroll Now'}
            </button>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <p className="text-center text-xs text-muted-foreground">
              Instructor: {teacherName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
