import { z } from 'zod';

// Common validation rules
const requiredString = z.string().min(1, 'Bu alan zorunludur');
const email = z.string().email('Geçerli bir e-posta adresi girin');
const password = z.string().min(8, 'Şifre en az 8 karakter olmalıdır');
const phone = z.string().optional().refine(
  (val) => !val || /^(\+90|0)?[5][0-9]{9}$/.test(val.replace(/\s/g, '')),
  'Geçerli bir telefon numarası girin'
);

// Login form validation
export const loginSchema = z.object({
  email: email,
  password: requiredString,
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration form validation
export const registerSchema = z.object({
  // Personal information
  email: email,
  password: password,
  password_confirm: requiredString,
  first_name: requiredString.min(2, 'Ad en az 2 karakter olmalıdır'),
  last_name: requiredString.min(2, 'Soyad en az 2 karakter olmalıdır'),
  
  // Company information
  company_name: requiredString.min(2, 'Şirket adı en az 2 karakter olmalıdır'),
  company_phone: phone,
  company_address: z.string().optional(),
  
  // Business terms (optional)
  credit_limit: z.number().optional().nullable(),
  payment_terms_days: z.number().min(1).max(365).optional(),
  notes: z.string().optional(),
  
  // Wholesaler relations (new format)
  wholesaler_relations: z.array(z.object({
    wholesaler_id: z.number(),
    credit_limit: z.number().optional().nullable(),
    payment_terms_days: z.number().min(1).max(365).optional(),
    notes: z.string().optional(),
  })).optional(),
  
  // Terms acceptance
  accept_terms: z.boolean().refine((val) => val === true, {
    message: 'Kullanım koşullarını kabul etmelisiniz',
  }),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['password_confirm'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// Profile update validation
export const profileUpdateSchema = z.object({
  first_name: requiredString.min(2, 'Ad en az 2 karakter olmalıdır'),
  last_name: requiredString.min(2, 'Soyad en az 2 karakter olmalıdır'),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// Password change validation
export const passwordChangeSchema = z.object({
  current_password: requiredString,
  new_password: password,
  confirm_password: requiredString,
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Yeni şifreler eşleşmiyor',
  path: ['confirm_password'],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Wholesaler relation validation
export const wholesalerRelationSchema = z.object({
  wholesaler_id: z.number().min(1, 'Toptancı seçimi zorunludur'),
  credit_limit: z.number().optional().nullable(),
  payment_terms_days: z.number().min(1, 'Ödeme vadesi en az 1 gün olmalıdır').max(365, 'Ödeme vadesi en fazla 365 gün olabilir'),
  notes: z.string().optional(),
});

export type WholesalerRelationFormData = z.infer<typeof wholesalerRelationSchema>;

// Search and filter validation
export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  in_stock: z.boolean().optional(),
  sort_by: z.enum(['name', 'price', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export type SearchFormData = z.infer<typeof searchSchema>;

// Contact form validation
export const contactSchema = z.object({
  name: requiredString.min(2, 'Ad en az 2 karakter olmalıdır'),
  email: email,
  subject: requiredString.min(3, 'Konu en az 3 karakter olmalıdır'),
  message: requiredString.min(10, 'Mesaj en az 10 karakter olmalıdır'),
  phone: phone,
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Newsletter subscription validation
export const newsletterSchema = z.object({
  email: email,
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

// Address validation
export const addressSchema = z.object({
  street: requiredString,
  city: requiredString,
  state: requiredString,
  postal_code: z.string().min(5, 'Posta kodu en az 5 karakter olmalıdır'),
  country: requiredString,
});

export type AddressFormData = z.infer<typeof addressSchema>;

// Order item validation
export const orderItemSchema = z.object({
  product_id: z.number().min(1),
  quantity: z.number().min(1, 'Miktar en az 1 olmalıdır'),
});

// Order validation
export const orderSchema = z.object({
  wholesaler_id: z.number().min(1, 'Toptancı seçimi zorunludur'),
  items: z.array(orderItemSchema).min(1, 'En az bir ürün eklemelisiniz'),
  delivery_address: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: phone,
  notes: z.string().optional(),
});

export type OrderFormData = z.infer<typeof orderSchema>;

// Company settings validation
export const companySettingsSchema = z.object({
  name: requiredString.min(2, 'Şirket adı en az 2 karakter olmalıdır'),
  phone: phone,
  address: z.string().optional(),
  email: email.optional(),
});

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// Validation helper functions
export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return z.string().min(8).safeParse(password).success;
}

export function validatePhone(phone: string): boolean {
  return z.string().regex(/^(\+90|0)?[5][0-9]{9}$/).safeParse(phone.replace(/\s/g, '')).success;
}

// Form error helper
export function getFormErrors<T>(
  schema: z.ZodSchema<T>,
  data: any
): Record<string, string> | null {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return null;
  }
  
  const errors: Record<string, string> = {};
  
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });
  
  return errors;
}

// Async validation helpers
export const asyncValidators = {
  emailExists: async (email: string): Promise<boolean> => {
    // This would call an API endpoint to check if email exists
    // For now, return false (email doesn't exist)
    return false;
  },
  
  companyNameExists: async (name: string): Promise<boolean> => {
    // This would call an API endpoint to check if company name exists
    // For now, return false (company name doesn't exist)
    return false;
  },
};

// Common validation messages
export const validationMessages = {
  required: 'Bu alan zorunludur',
  email: 'Geçerli bir e-posta adresi girin',
  password: 'Şifre en az 8 karakter olmalıdır',
  passwordMismatch: 'Şifreler eşleşmiyor',
  phone: 'Geçerli bir telefon numarası girin',
  minLength: (min: number) => `En az ${min} karakter olmalıdır`,
  maxLength: (max: number) => `En fazla ${max} karakter olabilir`,
  min: (min: number) => `En az ${min} olmalıdır`,
  max: (max: number) => `En fazla ${max} olabilir`,
  numeric: 'Sadece sayı girebilirsiniz',
  url: 'Geçerli bir URL girin',
  acceptTerms: 'Kullanım koşullarını kabul etmelisiniz',
};

export default {
  loginSchema,
  registerSchema,
  profileUpdateSchema,
  passwordChangeSchema,
  wholesalerRelationSchema,
  searchSchema,
  contactSchema,
  newsletterSchema,
  addressSchema,
  orderSchema,
  companySettingsSchema,
  validateEmail,
  validatePassword,
  validatePhone,
  getFormErrors,
  asyncValidators,
  validationMessages,
};