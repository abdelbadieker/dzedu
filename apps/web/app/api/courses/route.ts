import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@dzedu/database';
import { createCourseSchema } from '@/lib/course/types';
import { canManageCourses } from '@/lib/course/permissions';
import { uniqueSlug } from '@/lib/course/slug';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const accessType = searchParams.get('accessType');
    const published = searchParams.get('published');
    const search = searchParams.get('search');
    const teacherId = searchParams.get('teacherId');

    const where: any = {};
    if (level) where.level = level;
    if (accessType) where.accessType = accessType;
    if (published === 'true') where.isPublished = true;
    if (teacherId) where.teacherId = teacherId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        teacher: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        _count: { select: { modules: true, enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Courses list error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    if (!canManageCourses(session.user.role)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const slug = uniqueSlug(parsed.data.title);

    const course = await prisma.course.create({
      data: {
        ...parsed.data,
        slug,
        teacherId: session.user.id,
        price: parsed.data.price ?? undefined,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Course create error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
