#!/usr/bin/env node

const REQUIRED = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'OTP_SECRET',
];

const OPTIONAL = [
  'APP_URL',
  'API_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'CHARGILY_API_KEY',
  'CHARGILY_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CDN_URL',
  'CDN_API_KEY',
  'SENTRY_DSN',
];

const missing: string[] = [];
for (const key of REQUIRED) {
  if (!process.env[key]) missing.push(key);
}

if (missing.length > 0) {
  console.error('Missing required environment variables:');
  missing.forEach((k) => console.error(`  - ${k}`));
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  for (const key of [...REQUIRED, ...OPTIONAL]) {
    if (key.startsWith('AUTH_SECRET') || key.startsWith('OTP_SECRET') || key.startsWith('STRIPE_')) {
      const val = process.env[key];
      if (val && (val.includes('your-') || val.includes('sk_test_'))) {
        console.warn(`  ⚠  ${key} appears to use a placeholder/default value`);
      }
    }
  }
}

console.log('✓ Environment variables validated');
