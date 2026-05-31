import { getTranslations } from 'next-intl/server';
import { prisma } from '@dzedu/database';
import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';
import CourseDetailClient from './course-detail-client';

export async function generateMetadata({
  params: { locale, courseId },
}: {
  params: { locale: string; courseId: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Courses' });
  return { title: t('title') };
}

export default async function CourseDetailPage({
  params: { locale, courseId },
}: {
  params: { locale: string; courseId: string };
}) {
  const session = await auth();
  const t = await getTranslations({ locale, namespace: 'Courses' });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      modules: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
            select: { id: true, title: true, sortOrder: true, isFree: true, videoDuration: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || !course.isPublished) notFound();

  const enrollment = session?.user?.id
    ? await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: session.user.id, courseId } },
        select: { id: true, status: true, progress: true },
      })
    : null;

  return (
    <CourseDetailClient
      course={JSON.parse(JSON.stringify(course))}
      enrollment={enrollment}
      userId={session?.user?.id ?? null}
      locale={locale}
    />
  );
}
