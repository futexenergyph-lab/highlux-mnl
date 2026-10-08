import { ChevronDown } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-[#e9dcc0] via-[#f3ead8] to-[#e9dcc0] text-ink">
      <div className="container relative flex h-8 items-center justify-center sm:h-9">
        <p className="truncate text-center font-sans text-[0.55rem] font-medium uppercase tracking-[0.1em] sm:text-[0.68rem] sm:tracking-[0.18em]">
          <span>100% Authentic</span>
          <span className="mx-1.5 opacity-60 sm:mx-4">|</span>
          <span className="hidden sm:inline">
            Luxury Bags <span className="mx-1.5">•</span> Watches <span className="mx-1.5">•</span> Diamonds{" "}
            <span className="mx-1.5">•</span> Jewelry
          </span>
          <span className="sm:hidden">Bags • Watches • Diamonds • Jewelry</span>
        </p>
        <button
          type="button"
          className="absolute right-4 hidden items-center gap-1 font-sans text-[0.65rem] font-medium uppercase tracking-[0.16em] md:flex"
          aria-label="Country: Philippines"
        >
          Philippines <ChevronDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
