import { z } from 'zod';

// Product validation
export const productSchema = z.object({
  name: z.string()
    .min(2, 'Product name must be at least 2 characters')
    .max(100, 'Product name too long'),
  barcode: z.string().optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  category: z.string().min(1, 'Please select a category'),
  buying_price: z.number()
    .min(0, 'Buying price cannot be negative')
    .max(999999, 'Price too high'),
  selling_price: z.number()
    .min(1, 'Selling price must be greater than 0')
    .max(999999, 'Price too high'),
  vat_rate: z.number().min(0, 'VAT rate cannot be negative').max(100, 'VAT rate too high'),
  unit: z.string().min(1, 'Please select a unit'),
  initial_stock: z.number()
    .min(0, 'Stock cannot be negative')
    .optional(),
  image_url: z.string().optional().or(z.literal(''))
}).refine(data => data.selling_price >= data.buying_price, {
  message: 'Selling price must be higher or equal to buying price',
  path: ['selling_price']
});

// Sale validation
export const saleSchema = z.object({
  items: z.array(z.any()).min(1, 'Cart is empty'),
  payment_method: z.enum(['cash', 'mpesa', 'card']),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  mpesa_phone: z.string()
    .regex(/^(07|01|2547|2541|\+2547|\+2541)\d{8}$/, 'Invalid Kenyan phone number')
    .optional()
}).refine(data => {
  if (data.payment_method === 'mpesa' && !data.mpesa_phone) {
    return false;
  }
  return true;
}, {
  message: 'Phone number is required for M-Pesa payments',
  path: ['mpesa_phone']
});

// User validation
export const userSchema = z.object({
  full_name: z.string().min(3, 'Full name is too short'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'manager', 'cashier', 'viewer']),
  branch_id: z.string().min(1, 'Please select a branch'),
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must contain only numbers').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional()
});

// Password change validation
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// PIN reset validation
export const pinResetSchema = z.object({
  currentPIN: z.string().optional().or(z.literal('')),
  newPIN: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must contain only numbers'),
  confirmPIN: z.string()
}).refine(data => data.newPIN === data.confirmPIN, {
  message: 'PINs do not match',
  path: ['confirmPIN']
});

// Restock validation
export const restockSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  supplier: z.string().optional().or(z.literal('')),
  cost: z.number().min(0, 'Cost cannot be negative').optional()
});

// Adjustment validation
export const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Select a product'),
  newQuantity: z.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(1, 'Select a reason')
});
