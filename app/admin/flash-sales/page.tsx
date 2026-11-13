import Link from "next/link";
import { Plus, Users, Zap } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getFlashRepo } from "@/lib/flash/repo";
import { FLASH_LABEL, FLASH_TONE, flashPhase, type FlashPhase } from "@/lib/flash/types";
import { Badge, PageHeader, btnGold, btnOutline, fmtDateTime } from "@/components/admin/ui";

export const metadata = { title: "Flash Sale Deals" };
export const dynamic = "force-dynamic";

export default async function FlashSalesPage() {
  await requireStaff("/admin/flash-sales");
  const repo = await getFlashRepo();
  const [events, items] = await Promise.all([repo.listEvents().catch(() => null), repo.listItems().catch(() => [])]);
  const order: Record<FlashPhase, number> = { live: 0, scheduled: 1, ended: 2 };
  const rows = (events ?? [])
    .map((e) => ({ e, phase: flashPhase(e), n: items.filter((i) => i.eventId === e.id).length }))
    .sort((a, b) => order[a.phase] - order[b.phase] || (a.phase === "ended" ? b.e.endsAt.localeCompare(a.e.endsAt) : a.e.startsAt.localeCompare(b.e.startsAt)));

  return (
    <>
      <PageHeader
        title="Flash Sale Deals"
        description="Put pieces on sale for a set time. The sale price shows and is charged only between the start and the end."
        actions={
          <>
            <Link href="/admin/flash-sales/new?kind=website" className={btnGold}><Plus className="h-4 w-4" /> Website flash sale</Link>
            <Link href="/admin/flash-sales/new?kind=group" className={btnOutline}><Users className="h-4 w-4" /> Group flash sale</Link>
          </>
        }
      />
      {events === null && (
        <p className="mb-5 border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">Flash sales need a one-time database update — run <code>supabase/migrations/20261111000018_flash_sales.sql</code> in the Supabase SQL Editor.</p>
      )}
      {rows.length === 0 ? (
        <div className="border border-gold/15 p-10 text-center text-sm text-cream-muted">
          <Zap className="mx-auto mb-3 h-8 w-8 text-gold/60" strokeWidth={1.2} />
          No flash sales yet. Tap <span className="text-gold-light">Website flash sale</span> or <span className="text-gold-light">Group flash sale</span> to set one up.
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map(({ e, phase, n }) => (
            <li key={e.id}>
              <Link href={`/admin/flash-sales/${e.id}`} className="flex items-center gap-3 border border-gold/20 bg-ink p-3 hover:border-gold">
                <Zap className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.2} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-cream">{e.title}</span>
                  <span className="block text-xs text-cream-dim">{e.kind === "group" ? "Group" : "Website"} · {fmtDateTime(e.startsAt)} – {fmtDateTime(e.endsAt)} · {n} piece{n === 1 ? "" : "s"}</span>
                </span>
                <Badge tone={FLASH_TONE[phase]}>{FLASH_LABEL[phase]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
