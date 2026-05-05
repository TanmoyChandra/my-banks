import { z } from 'zod';

// UPI / QR entry schema
export const upiSchema = z.object({
  name: z.string().default(''),
  bankName: z.string().default(''),
  upiId: z.string().min(1, 'UPI ID is required').refine(
    (val) => val.includes('@'),
    { message: 'UPI ID must contain @' }
  ),
  qrValue: z.string().default(''),
  mobileNumber: z.string().default(''),
  address: z.string().default(''),
  notes: z.string().default(''),
});

// Card entry schema
export const cardSchema = z.object({
  type: z.enum(['Credit', 'Debit']),
  bankName: z.string().min(1, 'Bank name is required'),
  holderName: z.string().min(1, 'Card holder name is required'),
  cardNumber: z.string().min(12, 'Card number must be at least 12 digits'),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Expiry must be MM/YY format'),
  cvv: z.string().default(''),
  nickname: z.string().default(''),
});

// Bank account schema
export const accountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountHolder: z.string().min(1, 'Account holder name is required'),
  accountNumber: z.string().min(6, 'Account number must be at least 6 digits'),
  ifsc: z.string().length(11, 'IFSC must be exactly 11 characters').regex(
    /^[A-Z]{4}0[A-Z0-9]{6}$/,
    { message: 'Invalid IFSC format (e.g. SBIN0001234)' }
  ),
  accountType: z.enum(['Savings', 'Current']),
  branchName: z.string().default(''),
});

export type UpiFormData = z.infer<typeof upiSchema>;
export type CardFormData = z.infer<typeof cardSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
