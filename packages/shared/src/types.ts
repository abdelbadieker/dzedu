import { UserRole, BanState, Language } from './enums';

export type DeviceFingerprint = {
  id: string;
  userAgent: string;
  ip: string;
  lastSeen: Date;
};

export type UserProfile = {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  banState: BanState;
  banExpiresAt?: Date;
  banReason?: string;
  language: Language;
  devices: DeviceFingerprint[];
  createdAt: Date;
  updatedAt: Date;
};
