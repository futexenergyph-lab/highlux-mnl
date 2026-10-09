import { z } from "zod";

export const phPhone = z
  .string()
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => /^(09|\+639|639)\d{9}$/.test(s), "Enter a valid PH mobile number (e.g. 0917 123 4567)");

export const addressSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  label: z.string().trim().min(1).max(40).default("Home"),
  fullName: z.string().trim().min(2, "Enter the recipient's name").max(120),
  phone: phPhone,
  line1: z.string().trim().min(3, "Enter the street address").max(200),
  barangay: z.string().trim().min(2, "Enter the barangay").max(100),
  city: z.string().trim().min(2, "Enter the city / municipality").max(100),
  province: z.string().trim().min(2, "Enter the province").max(100),
  zip: z.string().trim().regex(/^\d{4}$/, "4-digit ZIP code"),
  isDefault: z.preprocess((v) => v === "on" || v === true, z.boolean()).optional(),
});
