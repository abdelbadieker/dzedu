import { UserRole } from '@dzedu/shared';

export function canManageCourses(role: string): boolean {
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER].includes(role as UserRole);
}

export function canManageAnyCourse(role: string): boolean {
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role as UserRole);
}

export function canDeleteCourse(role: string): boolean {
  return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role as UserRole);
}
