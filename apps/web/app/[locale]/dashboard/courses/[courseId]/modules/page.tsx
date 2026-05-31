import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { canManageCourses, canManageAnyCourse } from '@/lib/course/permissions';
import { redirect, notFound } from 'next/navigation';
import ModuleList from '@/components/courses/module-list';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('courses') };
}

export default async function CourseModulesPage({
  params: { locale, courseId },
}: {
  params: { locale: string; courseId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (!canManageCourses(session.user.role)) redirect(`/${locale}/dashboard`);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: { lessons: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!course) notFound();
  if (course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/courses`}
          className="rounded-lg border p-2 hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground">Module & lesson management</p>
        </div>
      </div>

      <ModuleList courseId={course.id} modules={course.modules as any} />
    </div>
  );
}
