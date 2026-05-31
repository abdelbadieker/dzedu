import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from './dashboard-shell';

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  return (
    <DashboardShell
      userId={session.user.id}
      userName={session.user.name ?? session.user.email ?? 'User'}
      userRole={session.user.role}
    >
      {children}
    </DashboardShell>
  );
}
