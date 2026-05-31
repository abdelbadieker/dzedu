import { NextResponse } from 'next/server';
import { prisma, InvoiceStatus, EnrollmentStatus } from '@dzedu/database';
import { requireAdmin } from '@/lib/admin/guard';

export async function GET() {
  try {
    await requireAdmin('ADMIN');

    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      activeEnrollments,
      totalInvoices,
      paidRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ where: { status: 'PAID' as InvoiceStatus }, _sum: { amount: true } }),
      prisma.subscription.count({ where: { status: EnrollmentStatus.ACTIVE } }),
    ]);

    return NextResponse.json({
      users: { total: totalUsers, students: totalStudents, teachers: totalTeachers },
      courses: { total: totalCourses, published: publishedCourses },
      enrollments: { total: totalEnrollments, active: activeEnrollments },
      revenue: { total: Number(paidRevenue._sum.amount ?? 0), currency: 'DZD' },
      subscriptions: { active: activeSubscriptions },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
