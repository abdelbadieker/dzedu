import { auth } from '@/lib/auth';
import { UserRole } from '@dzedu/shared';

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export async function requireAdmin(minRole: AdminRole = 'ADMIN') {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }

  const role = session.user.role as string;

  if (minRole === 'SUPER_ADMIN' && role !== UserRole.SUPER_ADMIN) {
    throw new Error('FORBIDDEN');
  }

  if (role !== UserRole.SUPER_ADMIN && role !== UserRole.ADMIN) {
    throw new Error('FORBIDDEN');
  }

  return session;
}
