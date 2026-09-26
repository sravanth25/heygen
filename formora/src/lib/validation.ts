import { z } from "zod";
import { shipping } from "@/config/shipping";

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(shipping.maxQuantityPerItem),
});

export const addressSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  line1: z.string().trim().min(3, "Enter your street address").max(120),
  line2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z
    .string()
    .trim()
    .refine((s) => shipping.supportedStates.includes(s), "Choose a state we deliver to"),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code (or ZIP+4)"),
});

export const contactSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .default("")
    .refine((s) => s === "" || /^[+\d][\d\s().-]{6,}$/.test(s), "Enter a valid phone number or leave it blank"),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(10),
  contact: contactSchema,
  address: addressSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type Address = z.infer<typeof addressSchema>;

/** Flatten zod issues into a { "address.zip": "message" } map. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
