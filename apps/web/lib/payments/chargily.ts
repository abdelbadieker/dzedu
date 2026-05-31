import { createHmac, timingSafeEqual } from 'node:crypto';

const CHARGILY_WEBHOOK_SECRET = process.env.CHARGILY_WEBHOOK_SECRET ?? '';

export function verifyChargilySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !CHARGILY_WEBHOOK_SECRET) return false;

  const expectedSig = createHmac('sha256', CHARGILY_WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');

  try {
    const expected = Buffer.from(expectedSig, 'utf8');
    const actual = Buffer.from(signatureHeader, 'utf8');
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
