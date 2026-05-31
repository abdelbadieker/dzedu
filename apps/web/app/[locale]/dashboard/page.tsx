import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { UserRole } from '@dzedu/shared';
import StudentOverview from './student-overview';
import TeacherOverview from './teacher-overview';
import AdminOverview from './admin-overview';
import ParentOverview from './parent-overview';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'Dashboard' });
  return { title: t('title') };
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  const t = await getTranslations({ locale, namespace: 'Dashboard' });

  if (!session?.user?.id) return null;

  const userName = session.user.name ?? session.user.email ?? '';
  const role = session.user.role as UserRole;

  switch (role) {
    case UserRole.SUPER_ADMIN:
    case UserRole.ADMIN:
      return <AdminOverview />;
    case UserRole.TEACHER:
      return <TeacherOverview userName={userName} welcome={t('welcome', { name: userName })} />;
    case UserRole.PARENT:
      return <ParentOverview userName={userName} welcome={t('welcome', { name: userName })} />;
    case UserRole.STUDENT:
    default:
      return <StudentOverview userName={userName} welcome={t('welcome', { name: userName })} />;
  }
}
