import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
import { hash, genSalt } from 'bcryptjs';

export function generateOtp(): string {
  return randomInt(100_000, 999_999).toString();
}

export function hashOtp(otp: string): string {
  const secret = process.env.OTP_SECRET ?? 'default-otp-secret-change-me';
  return createHash('sha256')
    .update(`${otp}:${secret}`)
    .digest('hex');
}

export function verifyOtp(otp: string, storedHash: string): boolean {
  const computedHash = hashOtp(otp);
  if (computedHash.length !== storedHash.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await genSalt(12);
  return hash(password, salt);
}
