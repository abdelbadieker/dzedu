import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { createLessonSchema, reorderSchema } from '@/lib/course/types';
import { canManageCourses, canManageAnyCourse } from '@/lib/course/permissions';

async function authorizeModuleAccess(courseId: string, moduleId: string, userId: string, role: string) {
  const mod = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
    include: { course: { select: { teacherId: true } } },
  });
  if (!mod) return { authorized: false, reason: 'NOT_FOUND' as const };
  if (mod.course.teacherId !== userId && !canManageAnyCourse(role)) {
    return { authorized: false, reason: 'FORBIDDEN' as const };
  }
  return { authorized: true as const, module: mod };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canManageCourses(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const access = await authorizeModuleAccess(params.courseId, params.moduleId, session.user.id, session.user.role);
    if (!access.authorized) {
      return NextResponse.json({ error: access.reason }, { status: access.reason === 'NOT_FOUND' ? 404 : 403 });
    }

    const body = await request.json();
    const parsed = createLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const maxOrder = await prisma.lesson.aggregate({
      where: { moduleId: params.moduleId },
      _max: { sortOrder: true },
    });

    const lesson = await prisma.lesson.create({
      data: {
        ...parsed.data,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        moduleId: params.moduleId,
      },
    });

    await prisma.course.update({
      where: { id: params.courseId },
      data: { totalLessons: { increment: 1 } },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Lesson create error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canManageCourses(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates = parsed.data.items.map((item) =>
      prisma.lesson.updateMany({
        where: { id: item.id, moduleId: params.moduleId },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lesson reorder error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
