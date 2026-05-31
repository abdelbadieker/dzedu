import { prisma } from '@dzedu/database';
import { headers } from 'next/headers';

const MAX_DEVICES = Number(process.env.MAX_CONCURRENT_DEVICES ?? '2');

export function getDeviceFingerprint(): string | null {
  const fingerprint = process.env.NODE_ENV === 'test'
    ? 'test-fingerprint'
    : null;
  return fingerprint;
}

export async function registerDeviceSession(
  userId: string,
  fingerprint: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  const existing = await prisma.deviceSession.findUnique({
    where: {
      userId_deviceFingerprint: { userId, deviceFingerprint: fingerprint },
    },
  });

  if (existing) {
    await prisma.deviceSession.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date(), ipAddress, userAgent },
    });
    return;
  }

  const activeCount = await prisma.deviceSession.count({
    where: { userId, isActive: true },
  });

  if (activeCount >= MAX_DEVICES) {
    const oldest = await prisma.deviceSession.findFirst({
      where: { userId, isActive: true },
      orderBy: { lastSeenAt: 'asc' },
    });

    if (oldest) {
      await prisma.deviceSession.update({
        where: { id: oldest.id },
        data: { isActive: false },
      });
    }
  }

  await prisma.deviceSession.create({
    data: {
      userId,
      deviceFingerprint: fingerprint,
      ipAddress,
      userAgent,
    },
  });
}

export async function validateDeviceLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxDevices: number;
}> {
  const currentCount = await prisma.deviceSession.count({
    where: { userId, isActive: true },
  });

  return {
    allowed: currentCount < MAX_DEVICES,
    currentCount,
    maxDevices: MAX_DEVICES,
  };
}

export async function deactivateDeviceSession(
  userId: string,
  fingerprint: string,
): Promise<void> {
  await prisma.deviceSession.updateMany({
    where: { userId, deviceFingerprint: fingerprint },
    data: { isActive: false },
  });
}
