import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { requireAdmin } from '@/lib/admin/guard';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin('ADMIN');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')));
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const banState = searchParams.get('banState');

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (role) where.role = role;
    if (banState) where.banState = banState;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: { select: { firstName: true, lastName: true, phoneNumber: true, avatarUrl: true } },
          _count: { select: { enrollments: true, taughtCourses: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
