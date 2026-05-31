import { getTranslations } from 'next-intl/server';
import { prisma } from '@dzedu/database';
import CourseCatalogClient from './course-catalog-client';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Courses' });
  return { title: t('title') };
}

export default async function CoursesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { level?: string; search?: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Courses' });

  const where: any = { isPublished: true };
  if (searchParams.level) where.level = searchParams.level;
  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: 'insensitive' } },
      { shortDescription: { contains: searchParams.search, mode: 'insensitive' } },
    ];
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      teacher: {
        select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
      },
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <CourseCatalogClient
      courses={JSON.parse(JSON.stringify(courses))}
      locale={locale}
    />
  );
}
