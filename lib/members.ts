import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
export { ID_TYPES } from "@/lib/member-options";

/** What a member gave when creating their account. Staff only — never shown on the storefront. */
export interface MemberDetails {
  userId: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  address: string;
  phone: string;
  occupation: string;
  idType: string;
  idNumber: string;
  idFilePath: string | null;
  termsAcceptedAt: string;
  consentAt: string;
  createdAt: string;
}


const g = globalThis as unknown as { __highluxMembers?: Map<string, MemberDetails> };
const memory = () => (g.__highluxMembers ??= new Map());

const toRow = (m: MemberDetails) => ({
  user_id: m.userId,
  full_name: m.fullName,
  date_of_birth: m.dateOfBirth,
  nationality: m.nationality,
  address: m.address,
  phone: m.phone,
  occupation: m.occupation,
  id_type: m.idType,
  id_number: m.idNumber,
  id_file_path: m.idFilePath,
  terms_accepted_at: m.termsAcceptedAt,
  consent_at: m.consentAt,
});
const fromRow = (r: any): MemberDetails => ({
  userId: r.user_id,
  fullName: r.full_name,
  dateOfBirth: r.date_of_birth,
  nationality: r.nationality,
  address: r.address,
  phone: r.phone,
  occupation: r.occupation,
  idType: r.id_type,
  idNumber: r.id_number,
  idFilePath: r.id_file_path,
  termsAcceptedAt: r.terms_accepted_at,
  consentAt: r.consent_at,
  createdAt: r.created_at,
});

export async function saveMemberDetails(m: Omit<MemberDetails, "createdAt">) {
  if (!isSupabaseConfigured()) {
    memory().set(m.userId, { ...m, createdAt: new Date().toISOString() });
    return;
  }
  const db = createAdminClient();
  const { error } = await db.from("member_details").upsert(toRow({ ...m, createdAt: "" }));
  if (error) throw error;
  // Keep the profile's phone in step so checkout prefills it.
  await db.from("profiles").update({ full_name: m.fullName, phone: m.phone }).eq("id", m.userId);
}

/** All members' details by user id (empty before the member-details SQL is run). */
export async function listMemberDetails(): Promise<Map<string, MemberDetails>> {
  if (!isSupabaseConfigured()) return new Map(memory());
  const { data, error } = await createAdminClient().from("member_details").select("*").limit(10000);
  if (error) return new Map();
  return new Map((data ?? []).map((r) => [r.user_id as string, fromRow(r)]));
}

export async function getMemberDetails(userId: string): Promise<MemberDetails | null> {
  if (!isSupabaseConfigured()) return memory().get(userId) ?? null;
  const { data } = await createAdminClient().from("member_details").select("*").eq("user_id", userId).maybeSingle();
  return data ? fromRow(data) : null;
}
