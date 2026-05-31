import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@dzedu/database';
import { validateFile, saveReceipt } from '@/lib/storage/file-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get('userId') as string | null;
    const courseId = formData.get('courseId') as string | null;
    const amount = formData.get('amount') as string | null;
    const notes = formData.get('notes') as string | null;
    const receiptFile = formData.get('receipt') as File | null;

    if (!userId || !amount || !receiptFile) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'userId, amount, et receipt sont requis' },
        { status: 400 },
      );
    }

    const validation = validateFile(receiptFile);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'FILE_INVALID', message: validation.error },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'INVALID_AMOUNT' }, { status: 400 });
    }

    const receiptFilename = await saveReceipt(receiptFile);
    const invoiceNumber = `MANUAL-${Date.now()}-${randomSuffix()}`;

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        courseId: courseId ?? undefined,
        amount: parsedAmount,
        currency: 'DZD',
        paymentMethod: 'BARIDIMOB_MANUAL',
        status: 'PENDING_ADMIN_APPROVAL',
        baridimobReceiptUrl: receiptFilename,
        adminNotes: notes ?? undefined,
      },
    });

    return NextResponse.json(
      {
        message: 'Reçu envoyé. En attente de validation par un administrateur.',
        invoiceNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Manual submit error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
