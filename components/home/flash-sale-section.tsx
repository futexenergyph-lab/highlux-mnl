import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPublicFlashSales } from "@/lib/flash/public";
import { FlashCountdown } from "@/components/flash/flash-countdown";
import { formatPHP } from "@/lib/utils";
import { NewArrivalsCarousel } from "./new-arrivals";

/** Homepage strip for the running flash sale (or the next one if none is running yet). Hidden when there's none. */
export async function FlashSaleSection() {
  const sales = await listPublicFlashSales().catch(() => []);
  const sale = sales.find((s) => s.items.some((i) => i.product.status !== "sold"));
  if (!sale) return null;
  const { event, phase } = sale;
  const items = sale.items.filter((i) => i.product.status !== "sold");
  const when = new Date(event.startsAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
  const captions = phase === "scheduled" ? Object.fromEntries(items.map((i) => [i.product.id, `Flash price ${formatPHP(i.salePrice)} from ${when}`])) : undefined;

  return (
    <section className="container pt-12 lg:pt-16">
      <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
        <p className="eyebrow text-gold">{phase === "live" ? "Flash sale · on now" : "Flash sale · coming soon"}</p>
        <h2 className="mt-2 font-serif text-3xl font-medium text-cream sm:text-4xl lg:text-[2.75rem]">{event.title}</h2>
        <FlashCountdown
          to={phase === "live" ? event.endsAt : event.startsAt}
          label={phase === "live" ? "Ends in" : "Starts in"}
          serverNow={new Date().toISOString()}
          className="mt-4 bg-gold-gradient px-4 py-2 text-xs uppercase tracking-wider text-ink"
        />
        <Link href="/flash-sale" className="eyebrow mt-4 inline-flex items-center gap-2 text-cream-muted transition hover:text-gold-light">
          View all flash deals <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <NewArrivalsCarousel products={items.map((i) => i.product)} captions={captions} />
    </section>
  );
}
