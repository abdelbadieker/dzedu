import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { updateModuleSchema } from '@/lib/course/types';
import { canManageCourses, canManageAnyCourse } from '@/lib/course/permissions';

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

    const mod = await prisma.module.findFirst({
      where: { id: params.moduleId, courseId: params.courseId },
      include: { course: { select: { teacherId: true } } },
    });
    if (!mod) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (mod.course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await prisma.module.update({
      where: { id: params.moduleId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Module update error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
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

    const mod = await prisma.module.findFirst({
      where: { id: params.moduleId, courseId: params.courseId },
      select: { id: true, course: { select: { teacherId: true } } },
    });
    if (!mod) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (mod.course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const deleted = await prisma.module.delete({ where: { id: params.moduleId } });

    await prisma.course.update({
      where: { id: params.courseId },
      data: { totalModules: { decrement: 1 } },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.error('Module delete error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
