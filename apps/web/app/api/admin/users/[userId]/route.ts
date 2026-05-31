import { NextRequest, NextResponse } from 'next/server';
import { prisma, BanState, UserRole } from '@dzedu/database';
import { requireAdmin } from '@/lib/admin/guard';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.nativeEnum(UserRole as any).optional(),
  banState: z.nativeEnum(BanState as any).optional(),
  banReason: z.string().max(500).optional(),
  banExpiresAt: z.string().datetime().optional(),
  language: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await requireAdmin('ADMIN');

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({ where: { id: params.userId } });
    if (!target) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    if (parsed.data.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const data: any = { ...parsed.data };
    if (data.banExpiresAt) data.banExpiresAt = new Date(data.banExpiresAt);

    const user = await prisma.user.update({
      where: { id: params.userId },
      data,
      include: { profile: { select: { firstName: true, lastName: true } } },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const session = await requireAdmin('SUPER_ADMIN');

    const target = await prisma.user.findUnique({ where: { id: params.userId } });
    if (!target) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }
    if (target.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'CANNOT_DELETE_SUPER_ADMIN' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id: params.userId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
