import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'receipts');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type de fichier non autorisé. Formats: JPEG, PNG, WebP, PDF' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux. Maximum 10 Mo.' };
  }

  return { valid: true };
}

export function sanitizeFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin';
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  const safeExt = allowedExts.includes(ext) ? ext : 'bin';
  return `${randomUUID()}.${safeExt}`;
}

export async function saveReceipt(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });

  const sanitizedName = sanitizeFileName(file.name);
  const filePath = join(UPLOAD_DIR, sanitizedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return sanitizedName;
}
