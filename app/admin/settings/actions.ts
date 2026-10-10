"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { PAYMENT_METHODS } from "@/lib/checkout/pricing";

const money = z.coerce.number().min(0).max(1_000_000);
const schema = z.object({
  shipping: z.object({ metroManila: money, metroManilaMax: z.union([money, z.null()]).default(null), provincial: money, freeOver: z.union([money, z.null()]) }),
  meetup: z.object({ enabled: z.boolean(), note: z.string().trim().max(300) }),
  pickup: z.object({ enabled: z.boolean(), address: z.string().trim().max(300) }),
  holds: z.object({
    checkoutMinutes: z.coerce.number().int().min(5).max(120),
    onlinePaymentMinutes: z.coerce.number().int().min(10).max(1440),
    bankTransferHours: z.coerce.number().int().min(1).max(168),
    meetupHours: z.coerce.number().int().min(1).max(336),
  }),
  layaway: z.object({
    enabled: z.boolean(),
    downPaymentPercent: z.coerce.number().int().min(10).max(90),
    installments: z.coerce.number().int().min(1).max(12),
    intervalDays: z.coerce.number().int().min(7).max(90),
    minSubtotal: money,
    terms: z.string().trim().max(1000),
  }),
  disabledMethods: z.array(z.enum(PAYMENT_METHODS)),
  bankAccounts: z.array(z.object({ bank: z.string().trim().min(1).max(60), accountName: z.string().trim().min(1).max(120), accountNumber: z.string().trim().min(4).max(40) })).min(1, "Add at least one bank account").max(6),
  notifyEmail: z.string().trim().email("Enter a valid notification email"),
});

export type SettingsInput = z.input<typeof schema>;

export async function saveSettingsAction(values: SettingsInput) {
  const staff = await assertStaff();
  if (staff.role !== "admin") return { error: "Only admins can change settings." };
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(" › ")}: ${parsed.error.issues[0].message}` };
  if (parsed.data.disabledMethods.includes("bank_transfer") && parsed.data.disabledMethods.includes("gcash") && parsed.data.disabledMethods.includes("maya") && parsed.data.disabledMethods.includes("card"))
    return { error: "Keep at least one way to pay online or by bank." };
  await (await getAdminRepo()).saveSetting("checkout", parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}
