import { z } from 'zod';
import { PaymentMethod } from '@dzedu/shared';

export const chargilyWebhookSchema = z.object({
  type: z.literal('invoice.paid'),
  data: z.object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    customer: z.object({
      id: z.string().optional(),
      email: z.string().optional(),
      name: z.string().optional(),
    }),
    metadata: z
      .object({
        userId: z.string(),
        courseId: z.string().optional(),
        invoiceNumber: z.string().optional(),
      })
      .passthrough(),
    payment_method: z.string().optional(),
    created_at: z.number().optional(),
    paid_at: z.number().optional(),
  }),
});

export const manualReceiptSchema = z.object({
  userId: z.string(),
  courseId: z.string().optional(),
  paymentMethod: z.enum(['BARIDIMOB_MANUAL']),
  amount: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export const stripeCheckoutSchema = z.object({
  userId: z.string(),
  priceId: z.string(),
  courseId: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type ChargilyWebhookPayload = z.infer<typeof chargilyWebhookSchema>;
export type ManualReceiptPayload = z.infer<typeof manualReceiptSchema>;
export type StripeCheckoutPayload = z.infer<typeof stripeCheckoutSchema>;
