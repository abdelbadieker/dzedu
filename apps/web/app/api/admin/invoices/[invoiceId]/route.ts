import { NextRequest, NextResponse } from 'next/server';
import { prisma, InvoiceStatus } from '@dzedu/database';
import { requireAdmin } from '@/lib/admin/guard';
import { z } from 'zod';

const updateInvoiceSchema = z.object({
  status: z.nativeEnum(InvoiceStatus as any),
  adminNotes: z.string().max(1000).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { invoiceId: string } },
) {
  try {
    const session = await requireAdmin('ADMIN');

    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: params.invoiceId } });
    if (!invoice) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const updateData: any = {
      status: parsed.data.status,
      adminApprovedById: session.user.id,
      adminNotes: parsed.data.adminNotes ?? invoice.adminNotes,
    };

    if (parsed.data.status === 'PAID') {
      updateData.paidAt = new Date();
    }
    if (parsed.data.status === 'REFUNDED') {
      updateData.refundedAt = new Date();
    }

    const updated = await prisma.invoice.update({
      where: { id: params.invoiceId },
      data: updateData,
    });

    if (parsed.data.status === 'PAID' && invoice.courseId) {
      const existing = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: invoice.userId, courseId: invoice.courseId } },
      });

      if (!existing) {
        await prisma.enrollment.create({
          data: { userId: invoice.userId, courseId: invoice.courseId },
        });
      } else if (existing.status !== 'ACTIVE') {
        await prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE' },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    console.error('Admin invoice update error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
