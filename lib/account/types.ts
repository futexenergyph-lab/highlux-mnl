export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  barangay: string;
  city: string;
  province: string;
  zip: string;
  isDefault: boolean;
}

export type AddressInput = Omit<SavedAddress, "id" | "isDefault"> & { id?: string; isDefault?: boolean };

export interface Profile {
  fullName: string | null;
  phone: string | null;
}
