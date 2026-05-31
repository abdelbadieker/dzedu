import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, EnrollmentStatus } from '@dzedu/database';
import { AccessType } from '@dzedu/shared';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          select: {
            id: true, title: true, slug: true, thumbnailUrl: true, level: true,
            teacher: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
            _count: { select: { modules: true, enrollments: true } },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Enrollments list error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { courseId } = await request.json();
    if (!courseId) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: { courseId: 'Required' } }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, accessType: true, isPublished: true },
    });

    if (!course || !course.isPublished) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'ALREADY_ENROLLED' }, { status: 409 });
    }

    if (course.accessType === AccessType.PER_COURSE) {
      const hasPaid = await prisma.invoice.findFirst({
        where: { userId: session.user.id, courseId, status: 'PAID' },
      });
      if (!hasPaid) {
        return NextResponse.json({ error: 'PAYMENT_REQUIRED' }, { status: 402 });
      }
    }

    if (course.accessType === AccessType.SUBSCRIPTION) {
      const sub = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          status: EnrollmentStatus.ACTIVE,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      });
      if (!sub) {
        return NextResponse.json({ error: 'SUBSCRIPTION_REQUIRED' }, { status: 402 });
      }
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: session.user.id, courseId },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Enrollment create error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
