import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { updateLessonSchema } from '@/lib/course/types';
import { canManageCourses, canManageAnyCourse } from '@/lib/course/permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canManageCourses(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: params.lessonId, moduleId: params.moduleId },
      include: { module: { include: { course: { select: { teacherId: true } } } } },
    });
    if (!lesson) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (lesson.module.course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await prisma.lesson.update({
      where: { id: params.lessonId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Lesson update error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { courseId: string; moduleId: string; lessonId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canManageCourses(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: params.lessonId, moduleId: params.moduleId },
      include: { module: { include: { course: { select: { teacherId: true } } } } },
    });
    if (!lesson) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (lesson.module.course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    await prisma.lesson.delete({ where: { id: params.lessonId } });

    await prisma.course.update({
      where: { id: params.courseId },
      data: { totalLessons: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lesson delete error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
