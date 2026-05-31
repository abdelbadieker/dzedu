import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { canManageCourses } from '@/lib/course/permissions';
import { redirect } from 'next/navigation';
import CourseForm from '@/components/courses/course-form';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Navigation' });
  return { title: t('courses') };
}

export default async function NewCoursePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (!canManageCourses(session.user.role)) redirect(`/${locale}/dashboard`);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Create Course</h1>
      <CourseForm />
    </div>
  );
}
