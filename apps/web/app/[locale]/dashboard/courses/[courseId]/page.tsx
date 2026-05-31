import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { canManageCourses, canManageAnyCourse } from '@/lib/course/permissions';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import CourseForm from '@/components/courses/course-form';

export async function generateMetadata({
  params: { locale, courseId },
}: {
  params: { locale: string; courseId: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('courses') };
}

export default async function EditCoursePage({
  params: { locale, courseId },
}: {
  params: { locale: string; courseId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (!canManageCourses(session.user.role)) redirect(`/${locale}/dashboard`);

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) notFound();
  if (course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Course</h1>
      <CourseForm
        courseId={course.id}
        initialData={{
          title: course.title,
          shortDescription: course.shortDescription ?? undefined,
          description: course.description ?? undefined,
          level: course.level as any,
          accessType: course.accessType as any,
          price: course.price ? Number(course.price) : undefined,
          thumbnailUrl: course.thumbnailUrl ?? undefined,
          tags: course.tags,
        }}
      />
    </div>
  );
}
