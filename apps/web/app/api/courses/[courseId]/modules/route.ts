import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { createModuleSchema, reorderSchema } from '@/lib/course/types';
import { canManageCourses, canManageAnyCourse } from '@/lib/course/permissions';

export async function POST(
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

    const course = await prisma.course.findUnique({ where: { id: params.courseId } });
    if (!course) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (course.teacherId !== session.user.id && !canManageAnyCourse(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const maxOrder = await prisma.module.aggregate({
      where: { courseId: params.courseId },
      _max: { sortOrder: true },
    });

    const mod = await prisma.module.create({
      data: {
        ...parsed.data,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        courseId: params.courseId,
      },
    });

    await prisma.course.update({
      where: { id: params.courseId },
      data: { totalModules: { increment: 1 } },
    });

    return NextResponse.json(mod, { status: 201 });
  } catch (error) {
    console.error('Module create error:', error);
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

    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates = parsed.data.items.map((item) =>
      prisma.module.updateMany({
        where: { id: item.id, courseId: params.courseId },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Module reorder error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
