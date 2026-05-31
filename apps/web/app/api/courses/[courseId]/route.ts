import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { updateCourseSchema } from '@/lib/course/types';
import { canManageCourses, canManageAnyCourse, canDeleteCourse } from '@/lib/course/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        teacher: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        modules: {
          include: { lessons: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course get error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canManageCourses(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const existing = await prisma.course.findUnique({ where: { id: params.courseId } });
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (existing.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const course = await prisma.course.update({
      where: { id: params.courseId },
      data: parsed.data,
    });

    return NextResponse.json(course);
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canDeleteCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    await prisma.course.delete({ where: { id: params.courseId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course delete error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
