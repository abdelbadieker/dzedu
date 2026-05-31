import { prisma, EnrollmentStatus } from '@dzedu/database';
import { AccessType } from '@dzedu/shared';

export async function canAccessCourse(userId: string, courseId: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { accessType: true, teacherId: true, isPublished: true },
  });

  if (!course || !course.isPublished) return false;

  if (course.accessType === AccessType.FREE) return true;

  if (course.teacherId === userId) return true;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { status: true, expiresAt: true },
  });

  if (!enrollment) return false;
  if (enrollment.status !== EnrollmentStatus.ACTIVE) return false;
  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) return false;

  return true;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: EnrollmentStatus.ACTIVE,
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    select: { id: true },
  });

  return !!sub;
}

export async function getEnrollmentOrNull(userId: string, courseId: string) {
  return prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, status: true, progress: true, enrolledAt: true, expiresAt: true },
  });
}
