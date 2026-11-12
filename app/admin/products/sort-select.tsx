"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { inputCls } from "@/components/admin/ui";
import { PRODUCT_SORTS } from "./sorts";


/** Sort dropdown under the filters; applies as soon as it's changed (keeps the tab, search and category). */
export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  return (
    <label className="relative mb-5 block">
      <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-dim" />
      <span className="sr-only">Sort products</span>
      <select
        value={value}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          if (e.target.value === "newest") next.delete("sort");
          else next.set("sort", e.target.value);
          router.push(`${path}?${next.toString()}`);
        }}
        className={`${inputCls} pl-9`}
      >
        {PRODUCT_SORTS.map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>
    </label>
  );
}
