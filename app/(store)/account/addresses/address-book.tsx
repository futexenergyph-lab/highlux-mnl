"use client";
import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { SavedAddress } from "@/lib/account/types";
import { METRO_MANILA_CITIES } from "@/lib/ph";
import { cn } from "@/lib/utils";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction, type FormState } from "../actions";

const input = "h-11 w-full border border-gold/30 bg-ink/60 px-3 text-sm text-cream placeholder:text-cream-dim/60 focus:border-gold focus:outline-none";
const labelCls = "mb-1 block text-[0.65rem] uppercase tracking-[0.14em] text-cream-muted";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold px-6 py-3 text-xs disabled:opacity-60">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save address
    </button>
  );
}

function AddressForm({ address, defaultName, onDone }: { address?: SavedAddress; defaultName: string; onDone: () => void }) {
  const [state, action] = useFormState<FormState, FormData>(saveAddressAction, null);
  const [province, setProvince] = React.useState(address?.province ?? "Metro Manila");
  React.useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);
  const mm = province === "Metro Manila";
  return (
    <form action={action} className="grid gap-4 border border-gold/30 bg-ink-50 p-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={address?.id ?? ""} />
      <label className="block"><span className={labelCls}>Label</span><input name="label" defaultValue={address?.label ?? "Home"} placeholder="Home, Office…" className={input} /></label>
      <label className="block"><span className={labelCls}>Recipient</span><input name="fullName" defaultValue={address?.fullName ?? defaultName} autoComplete="name" required className={input} /></label>
      <label className="block"><span className={labelCls}>Mobile number</span><input name="phone" type="tel" defaultValue={address?.phone} placeholder="0917 123 4567" autoComplete="tel" required className={input} /></label>
      <label className="block"><span className={labelCls}>Region</span>
        <select value={mm ? "mm" : "prov"} onChange={(e) => setProvince(e.target.value === "mm" ? "Metro Manila" : "")} className={input}>
          <option value="mm">Metro Manila</option>
          <option value="prov">Provincial</option>
        </select>
      </label>
      <label className="block sm:col-span-2"><span className={labelCls}>House / unit no., street, building</span><input name="line1" defaultValue={address?.line1} autoComplete="address-line1" required className={input} /></label>
      <label className="block"><span className={labelCls}>Barangay</span><input name="barangay" defaultValue={address?.barangay} required className={input} /></label>
      <label className="block"><span className={labelCls}>City / municipality</span>
        {mm ? (
          <select name="city" defaultValue={address?.city ?? ""} required className={input}>
            <option value="">Select city</option>
            {METRO_MANILA_CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        ) : (
          <input name="city" defaultValue={address?.province !== "Metro Manila" ? address?.city : ""} required className={input} />
        )}
      </label>
      <label className="block"><span className={labelCls}>Province</span><input name="province" value={province} onChange={(e) => setProvince(e.target.value)} readOnly={mm} required className={input} /></label>
      <label className="block"><span className={labelCls}>ZIP code</span><input name="zip" defaultValue={address?.zip} inputMode="numeric" maxLength={4} pattern="\d{4}" required className={input} /></label>
      {!address?.isDefault && (
        <label className="flex items-center gap-2 text-sm text-cream-muted sm:col-span-2"><input type="checkbox" name="isDefault" className="accent-[#c9a24a]" /> Make this my default address</label>
      )}
      {state?.error && <p className="text-sm text-red-300 sm:col-span-2" role="alert">{state.error}</p>}
      <div className="flex gap-3 sm:col-span-2">
        <Save />
        <button type="button" onClick={onDone} className="btn-outline-gold px-6 py-3 text-xs">Cancel</button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses, defaultName }: { addresses: SavedAddress[]; defaultName: string }) {
  const [editing, setEditing] = React.useState<string | "new" | null>(addresses.length ? null : "new");
  const [pending, start] = React.useTransition();
  const done = React.useCallback(() => setEditing(null), []);

  return (
    <div className={cn("mt-8 space-y-4", pending && "opacity-60")}>
      {addresses.map((a) =>
        editing === a.id ? (
          <AddressForm key={a.id} address={a} defaultName={defaultName} onDone={done} />
        ) : (
          <div key={a.id} className={cn("flex gap-4 border p-5", a.isDefault ? "border-gold/50" : "border-gold/15")}>
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" strokeWidth={1.1} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="flex items-center gap-2">
                <span className="eyebrow text-cream">{a.label}</span>
                {a.isDefault && <span className="border border-gold/60 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-wider text-gold-light">Default</span>}
              </p>
              <p className="mt-2 text-cream">{a.fullName} · {a.phone}</p>
              <p className="text-cream-muted">{a.line1}, {a.barangay}, {a.city}, {a.province} {a.zip}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs uppercase tracking-wider">
                <button onClick={() => setEditing(a.id)} className="flex items-center gap-1.5 text-cream-muted hover:text-gold-light"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                {!a.isDefault && <button onClick={() => start(() => setDefaultAddressAction(a.id))} className="flex items-center gap-1.5 text-cream-muted hover:text-gold-light"><Star className="h-3.5 w-3.5" /> Set as default</button>}
                <button onClick={() => confirm(`Delete the "${a.label}" address?`) && start(() => deleteAddressAction(a.id))} className="flex items-center gap-1.5 text-cream-muted hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          </div>
        ),
      )}
      {editing === "new" ? (
        <AddressForm defaultName={defaultName} onDone={done} />
      ) : (
        <button onClick={() => setEditing("new")} className="flex w-full items-center justify-center gap-2 border border-dashed border-gold/40 py-5 text-xs uppercase tracking-wider2 text-gold-light hover:border-gold">
          <Plus className="h-4 w-4" /> Add an address
        </button>
      )}
    </div>
  );
}
