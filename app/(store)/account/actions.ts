"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, authMode } from "@/lib/auth/server";
import { demoSetPassword } from "@/lib/auth/demo";
import { getAccountRepo } from "@/lib/account/repo";
import { createClient } from "@/lib/supabase/server";
import { addressSchema, phPhone } from "@/lib/account/validation";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

async function userOrThrow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  return user;
}

export async function saveAddressAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await userOrThrow();
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await (await getAccountRepo()).saveAddress(user, parsed.data);
  revalidatePath("/account", "layout");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(id: string) {
  const user = await userOrThrow();
  await (await getAccountRepo()).deleteAddress(user, id);
  revalidatePath("/account", "layout");
}

export async function setDefaultAddressAction(id: string) {
  const user = await userOrThrow();
  await (await getAccountRepo()).setDefaultAddress(user, id);
  revalidatePath("/account", "layout");
}

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await userOrThrow();
  const parsed = z
    .object({ fullName: z.string().trim().min(2, "Enter your name").max(120), phone: z.union([phPhone, z.literal("").transform(() => null)]) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await (await getAccountRepo()).updateProfile(user, parsed.data);
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await userOrThrow();
  const parsed = z
    .object({ password: z.string().min(8, "At least 8 characters").max(72), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords don't match" })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (authMode() === "demo") demoSetPassword(user.id, parsed.data.password);
  else {
    const { error } = await createClient().auth.updateUser({ password: parsed.data.password });
    if (error) return { error: error.message };
  }
  return { ok: true, message: "Password updated." };
}
