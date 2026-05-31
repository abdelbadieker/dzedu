import { getTranslations } from 'next-intl/server';
import { prisma } from '@dzedu/database';
import { auth } from '@/lib/auth';
import { canAccessCourse } from '@/lib/enrollment/access';
import { notFound } from 'next/navigation';
import LessonViewerClient from './lesson-viewer-client';

export async function generateMetadata({
  params: { locale, lessonId },
}: {
  params: { locale: string; lessonId: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Courses' });
  return { title: t('title') };
}

export default async function LessonPage({
  params: { locale, courseId, lessonId },
}: {
  params: { locale: string; courseId: string; lessonId: string };
}) {
  const session = await auth();

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, module: { courseId } },
    include: {
      module: {
        select: { id: true, title: true, courseId: true },
      },
    },
  });

  if (!lesson || !lesson.isPublished) notFound();

  const isFree = lesson.isFree;
  const isOwner = session?.user?.id
    ? await prisma.course.findFirst({ where: { id: courseId, teacherId: session.user.id } }).then(Boolean)
    : false;

  const hasAccess = isFree || isOwner || (session?.user?.id
    ? await canAccessCourse(session.user.id, courseId)
    : false);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">Enroll in this course to access this lesson.</p>
        <a
          href={`/${locale}/courses/${courseId}`}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to Course
        </a>
      </div>
    );
  }

  return (
    <LessonViewerClient
      lesson={JSON.parse(JSON.stringify(lesson))}
      courseId={courseId}
      userName={session?.user?.name ?? session?.user?.email ?? 'User'}
      locale={locale}
    />
  );
}
