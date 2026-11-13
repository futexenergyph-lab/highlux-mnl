import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getFlashRepo } from "@/lib/flash/repo";
import { FLASH_KIND_LABEL, FLASH_LABEL, FLASH_TONE, flashPhase } from "@/lib/flash/types";
import { formatPHP } from "@/lib/utils";
import { Badge, Card, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { AddItemForm } from "./add-item-form";
import { DeleteFlashButton } from "./delete-button";
import { ItemControls } from "./item-row";

export const metadata = { title: "Flash sale" };
export const dynamic = "force-dynamic";

const STATUS_NOTE = { available: null, reserved: "On hold / in checkout", sold: "Sold", hidden: "Hidden from site" } as const;

export default async function FlashSaleEventPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string; added?: string; updated?: string } }) {
  await requireStaff(`/admin/flash-sales/${params.id}`);
  const repo = await getFlashRepo();
  const event = await repo.getEvent(params.id).catch(() => null);
  if (!event) notFound();
  const [items, all] = await Promise.all([repo.listItems(event.id), (await getAdminRepo()).listProducts()]);
  const products = new Map(all.map((p) => [p.id, p]));
  const inSale = new Set(items.map((i) => i.productId));
  const options = all
    .filter((p) => p.status === "available" && !inSale.has(p.id))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({ id: p.id, label: p.title, price: p.price, image: p.images[0]?.url ?? null }));
  const phase = flashPhase(event);
  const group = event.kind === "group";
  const total = items.reduce((s, i) => s + i.salePrice, 0);

  return (
    <>
      <Link href="/admin/flash-sales" className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light"><ArrowLeft className="h-3.5 w-3.5" /> Flash Sale Deals</Link>
      <PageHeader title={event.title} titleAddon={<Badge tone={FLASH_TONE[phase]}>{FLASH_LABEL[phase]}</Badge>} description={`${FLASH_KIND_LABEL[event.kind]} · ${fmtDateTime(event.startsAt)} – ${fmtDateTime(event.endsAt)}`} />
      {searchParams.created && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Flash sale created. Now add the pieces and their sale prices.</p>}
      {searchParams.updated && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Flash sale updated.</p>}
      {searchParams.added && <p role="status" className="mb-5 border border-gold/40 bg-gold/[0.06] p-3 text-sm text-cream">Piece added to the flash sale.</p>}

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {phase !== "ended" && (
            <Card title="Add a piece">
              <AddItemForm key={items.length} eventId={event.id} items={options} was={Object.fromEntries(all.map((p) => [p.id, Math.max(p.compareAtPrice ?? 0, p.price)]))} group={group} />
            </Card>
          )}
          <Card title={`Pieces on flash sale (${items.length})`}>
            {items.length === 0 ? (
              <p className="text-sm text-cream-muted">No pieces yet.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-gold/10">
                {items.map((i) => {
                  const p = products.get(i.productId);
                  const note = p ? STATUS_NOTE[p.status] : "Deleted piece";
                  return (
                    <li key={i.id} className="flex gap-3 p-2">
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden border border-gold/15 bg-ink-50">
                        {p?.images[0] && <Image src={p.images[0].url} alt="" fill sizes="64px" unoptimized className="object-cover" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        {p ? (
                          <Link href={`/admin/products/${p.id}`} className="block truncate text-sm text-cream hover:text-gold-light">{p.title}</Link>
                        ) : (
                          <span className="block text-sm text-cream-dim">Deleted piece</span>
                        )}
                        {note && <span className="block text-xs text-gold-light/80">{note}</span>}
                        <ItemControls eventId={event.id} itemId={i.id} title={p?.title ?? "Deleted piece"} salePrice={i.salePrice} stealPrice={i.stealPrice} group={group} current={p?.price ?? i.salePrice} was={Math.max(p?.compareAtPrice ?? 0, p?.price ?? i.salePrice)} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Status</dt><dd><Badge tone={FLASH_TONE[phase]}>{FLASH_LABEL[phase]}</Badge></dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Starts</dt><dd className="text-right text-cream">{fmtDateTime(event.startsAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Ends</dt><dd className="text-right text-cream">{fmtDateTime(event.endsAt)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">Pieces</dt><dd className="text-cream">{items.length}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-cream-dim">{group ? "Total at Mine prices" : "Total at sale prices"}</dt><dd className="tabular-nums text-gold-light">{formatPHP(total)}</dd></div>
              {group && (
                <div className="flex justify-between gap-3"><dt className="shrink-0 text-cream-dim">Group link</dt><dd className="min-w-0 truncate text-right">{event.groupLink ? <a href={event.groupLink} target="_blank" rel="noopener noreferrer" className="text-gold-light underline">{event.groupLink.replace(/^https?:\/\//, "")}</a> : <span className="text-red-300">Not set — Edit to add it</span>}</dd></div>
              )}
            </dl>
            <p className="mt-3 text-xs text-cream-dim">
              {group
                ? "Selling happens in the group: customers comment Mine or Steal. The website shows the Mine and Steal prices with a Join group button; the shop's regular price doesn't change."
                : "Between the start and the end, these pieces show their sale price in the shop and checkout charges it. When the sale ends, the regular prices come back by themselves."}
            </p>
          </Card>
          <Card title="Share">
            <CopyLinkButton path="/flash-sale" label="Copy flash sale page link" />
            <p className="mt-2 text-xs text-cream-dim">Opens the Flash Sale page with a countdown and every piece on sale.</p>
          </Card>
          <Link href={`/admin/flash-sales/${event.id}/edit`} className="flex h-10 items-center justify-center border border-gold/40 text-xs uppercase tracking-wider text-cream hover:border-gold">{group ? "Edit title, times or group link" : "Edit title or times"}</Link>
          <DeleteFlashButton id={event.id} title={event.title} />
        </div>
      </div>
    </>
  );
}
