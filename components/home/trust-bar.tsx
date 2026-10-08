import { CreditCard, Gem, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { Icon: ShieldCheck, title: "100% Authentic", body: "Money-back guarantee if proven fake." },
  { Icon: Truck, title: "Nationwide Shipping", body: "Within & outside Metro Manila." },
  { Icon: CreditCard, title: "Credit Card Accepted", body: "For meet-up transactions." },
  { Icon: Gem, title: "Carefully Curated", body: "Pre-loved luxury at competitive prices." },
];

export function TrustBar({ overlay = false }: { overlay?: boolean }) {
  return (
    <div className={cn(overlay ? "bg-ink/70 backdrop-blur-[2px]" : "border-y border-gold/15 bg-ink-50")}>
      <ul className="container grid grid-cols-2 gap-y-6 py-6 lg:grid-cols-4 lg:gap-0 lg:py-7">
        {ITEMS.map(({ Icon, title, body }, i) => (
          <li
            key={title}
            className={cn(
              "flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left lg:justify-center lg:px-6",
              i > 0 && "lg:border-l lg:border-cream/40",
            )}
          >
            <Icon className="h-9 w-9 shrink-0 text-gold-light sm:h-12 sm:w-12" strokeWidth={0.9} />
            <div>
              <p className="font-sans text-[0.68rem] font-medium uppercase tracking-[0.14em] text-cream sm:text-sm">{title}</p>
              <p className="mt-0.5 font-sans text-[0.7rem] leading-snug text-cream/75 sm:text-[0.82rem]">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
