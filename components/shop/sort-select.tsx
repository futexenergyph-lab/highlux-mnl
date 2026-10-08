"use client";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { SORTS, filtersToQuery, type Filters, type SortKey } from "@/lib/filters";

export function SortSelect({ filters }: { filters: Filters }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="relative flex min-w-0 items-center">
      <span className="sr-only">Sort by</span>
      <select
        value={filters.sort}
        onChange={(e) => router.push(`${pathname}${filtersToQuery({ ...filters, sort: e.target.value as SortKey, page: 1 })}`, { scroll: false })}
        className="h-10 w-full min-w-0 appearance-none border border-gold/30 bg-ink pl-3 pr-9 font-sans text-xs uppercase tracking-wider2 text-cream focus:border-gold focus:outline-none"
      >
        {Object.entries(SORTS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-gold" />
    </label>
  );
}
