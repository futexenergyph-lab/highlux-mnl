export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  provider: "email" | "google";
  emailVerified: boolean;
}

export type AuthMode = "supabase" | "demo" | "off";
