import { Injectable } from '@nestjs/common';
import { writeFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { prisma } from '@dzedu/database';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'receipts');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class PaymentsService {
  async submitManualReceipt(params: {
    userId: string;
    courseId?: string;
    amount: number;
    notes?: string;
    file: Express.Multer.File;
  }) {
    const { userId, courseId, amount, notes, file } = params;

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('TYPE_NOT_ALLOWED');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    await writeFile(filepath, file.buffer);

    const invoiceNumber = `MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        userId,
        courseId: courseId ?? null,
        amount,
        currency: 'DZD',
        paymentMethod: 'BARIDIMOB_MANUAL',
        status: 'PENDING_ADMIN_APPROVAL',
        baridimobReceiptUrl: filename,
        adminNotes: notes ?? null,
      },
    });

    return { invoiceNumber };
  }
}
