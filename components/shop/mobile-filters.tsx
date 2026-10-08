"use client";
import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterPanel } from "./filter-panel";
import type { Facets, Filters } from "@/lib/filters";

export function MobileFilters({ filters, facets, total }: { filters: Filters; facets: Facets; total: number }) {
  const [open, setOpen] = React.useState(false);
  const active =
    filters.brands.length + filters.conditions.length + filters.colors.length + (filters.min || filters.max ? 1 : 0) + (filters.availableOnly || filters.soldOnly ? 1 : 0);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex h-10 items-center justify-center gap-2 border border-gold/30 px-4 font-sans text-xs uppercase tracking-wider2 text-cream lg:hidden">
          <SlidersHorizontal className="h-4 w-4 text-gold" strokeWidth={1.25} /> Filter
          {active > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-ink">{active}</span>}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[92%]">
        <SheetTitle className="border-b border-gold/20 px-6 py-5 font-serif text-xl text-cream">Filter</SheetTitle>
        <div className="flex-1 overflow-y-auto px-6">
          <FilterPanel filters={filters} facets={facets} onNavigate={() => setOpen(false)} />
        </div>
        <div className="border-t border-gold/20 p-4">
          <button onClick={() => setOpen(false)} className="btn-gold w-full text-xs">
            Show {total} {total === 1 ? "piece" : "pieces"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
