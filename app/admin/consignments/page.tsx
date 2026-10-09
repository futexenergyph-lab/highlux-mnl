import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { CONSIGNMENT_STATUSES } from "@/lib/admin/types";
import { formatPHP } from "@/lib/utils";
import { Badge, PageHeader, Tabs, fmtDateTime } from "@/components/admin/ui";

export const metadata = { title: "Consignments" };

const CONSIGN_TONE = { new: "gold", reviewing: "blue", offered: "blue", accepted: "green", declined: "red", received: "muted" } as const;

export default async function ConsignmentsPage({ searchParams }: { searchParams: { status?: string } }) {
  await requireStaff("/admin/consignments");
  const all = await (await getAdminRepo()).listConsignments();
  const status = searchParams.status ?? "open";
  const list = all.filter((c) => (status === "open" ? !["declined", "received"].includes(c.status) : status === "all" || c.status === status));
  const tabs = [
    { key: "open", label: "Open", count: all.filter((c) => !["declined", "received"].includes(c.status)).length },
    ...CONSIGNMENT_STATUSES.map((s) => ({ key: s, label: s, count: all.filter((c) => c.status === s).length })),
    { key: "all", label: "All", count: all.length },
  ].map((t) => ({ ...t, href: `/admin/consignments?status=${t.key}` }));

  return (
    <>
      <PageHeader title="Consignments" description="“Sell to Us” submissions from the website." />
      <Tabs tabs={tabs} current={status} />
      {list.length === 0 ? (
        <p className="border border-gold/15 p-10 text-center text-sm text-cream-muted">No submissions here.</p>
      ) : (
        <ul className="divide-y divide-gold/10 border border-gold/15 bg-ink">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/consignments/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-cream/[0.02]">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-cream">{c.brand} · {c.model}</span>
                    <Badge tone={CONSIGN_TONE[c.status]}>{c.status}</Badge>
                  </span>
                  <span className="block text-xs text-cream-muted">{c.fullName} · {c.phone} · wants to {c.wants} · {c.photoPaths.length} photos</span>
                  <span className="block text-xs text-cream-dim">{fmtDateTime(c.createdAt)}</span>
                </span>
                {c.askingPrice && <span className="text-sm text-cream">{formatPHP(c.askingPrice)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
