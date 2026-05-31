export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

export enum EducationLevel {
  PRIMARY = 'PRIMARY',
  MIDDLE = 'MIDDLE',
  HIGH_BAC = 'HIGH_BAC',
  SKILLS = 'SKILLS',
}

export enum AccessType {
  FREE = 'FREE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PER_COURSE = 'PER_COURSE',
}

export enum PaymentMethod {
  CHARGILY_CIB = 'CHARGILY_CIB',
  CHARGILY_EDAHABIA = 'CHARGILY_EDAHABIA',
  BARIDIMOB_MANUAL = 'BARIDIMOB_MANUAL',
  STRIPE = 'STRIPE',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PENDING_ADMIN_APPROVAL = 'PENDING_ADMIN_APPROVAL',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum BanState {
  NONE = 'NONE',
  TEMPORARY = 'TEMPORARY',
  PERMANENT = 'PERMANENT',
}

export enum Language {
  AR = 'ar',
  FR = 'fr',
  EN = 'en',
}
