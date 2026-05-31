import { NextRequest, NextResponse } from 'next/server';
import { prisma, InvoiceStatus, PaymentMethod } from '@dzedu/database';
import { requireAdmin } from '@/lib/admin/guard';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin('ADMIN');

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Number(searchParams.get('limit') ?? '20'));
    const status = searchParams.get('status');
    const method = searchParams.get('method');

    const where: any = {};
    if (status) where.status = status;
    if (method) where.paymentMethod = method;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, email: true,
              profile: { select: { firstName: true, lastName: true, phoneNumber: true } },
            },
          },
          course: { select: { id: true, title: true } },
          adminApprovedBy: { select: { id: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    console.error('Admin invoices list error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
