import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { canManageCourses } from '@/lib/course/permissions';
import { redirect } from 'next/navigation';
import CourseListClient from './course-list-client';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('myCourses') };
}

export default async function CoursesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const isTeacher = canManageCourses(session.user.role);
  const isAdmin = session.user.role === 'SUPER_ADMIN' || session.user.role === 'ADMIN';

  const where: any = {};
  if (isTeacher && !isAdmin) {
    where.teacherId = session.user.id;
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <CourseListClient
      courses={JSON.parse(JSON.stringify(courses))}
      isTeacher={isTeacher}
      locale={locale}
    />
  );
}
