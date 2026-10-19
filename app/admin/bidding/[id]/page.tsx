import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { getAdminRepo } from "@/lib/admin/repo";
import { getAuctionRepo } from "@/lib/auctions/repo";
import { settleDueAuctions } from "@/lib/auctions/service";
import { auctionPhase, nextMinBid, topBid } from "@/lib/auctions/types";
import { formatPHP } from "@/lib/utils";
import { Badge, Card, PageHeader, fmtDateTime } from "@/components/admin/ui";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { CancelAuctionButton } from "./cancel-button";

export const metadata = { title: "Auction" };
export const dynamic = "force-dynamic";

export default async function AuctionAdminPage({ params, searchParams }: { params: { id: string }; searchParams: { created?: string } }) {
  await requireStaff(`/admin/bidding/${params.id}`);
  const repo = await getAuctionRepo();
  let a = await repo.get(params.id);
  if (!a) notFound();
  if (await settleDueAuctions([a])) a = (await repo.get(params.id))!;
  const product = await (await getAdminRepo()).getProduct(a.productId);
  const phase = auctionPhase(a);
  const top = topBid(a);
  const winner = a.bids.find((b) => b.id === a!.winnerBidId);
  const order = a.orderId ? ((await (await getAdminRepo()).listOrders()).find((o) => o.id === a!.orderId)?.orderNumber ?? null) : null;

  return (
    <>
      <Link href="/admin/bidding" className="text-xs uppercase tracking-wider text-cream-muted hover:text-gold-light">← Bidding</Link>
      <PageHeader
        title={product?.title ?? "Auction"}
        description={phase === "scheduled" ? `Starts ${fmtDateTime(a.startsAt)} · ends ${fmtDateTime(a.endsAt)}` : `${phase === "live" ? "Ends" : "Ended"} ${fmtDateTime(a.endsAt)}`}
        actions={<Badge tone={phase === "live" ? "green" : phase === "scheduled" ? "gold" : phase === "cancelled" ? "red" : "muted"}>{phase}</Badge>}
      />
      {searchParams.created && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-gold/40 bg-gold/[0.06] p-4 text-sm text-cream">
          Auction is {phase === "scheduled" ? "scheduled" : "live"}. Share the bidding link with your buyers.
          <CopyLinkButton path={`/bidding/${a.id}`} />
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <Card title={`Bids (${a.bids.length})`}>
          {a.bids.length === 0 ? (
            <p className="text-sm text-cream-muted">No bids yet.</p>
          ) : (
            <ul className="divide-y divide-gold/10 text-sm">
              {a.bids.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-cream">{b.contact.fullName || b.bidderName} {b.id === top?.id && <span className="ml-1 text-[0.6rem] uppercase tracking-wider text-gold">highest</span>}</span>
                    <span className="block truncate text-xs text-cream-dim">{[b.contact.email, b.contact.phone].filter(Boolean).join(" · ")} · {fmtDateTime(b.createdAt)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-gold-light">{formatPHP(b.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="space-y-5">
          <Card title="Summary">
            {product?.images[0] && (
              <span className="relative mb-3 block aspect-square w-full overflow-hidden border border-gold/15">
                <Image src={product.images[0].url} alt="" fill sizes="320px" unoptimized className="object-cover" />
              </span>
            )}
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-cream-muted">Starting bid</dt><dd>{formatPHP(a.startingBid)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Increment</dt><dd>{formatPHP(a.minIncrement)}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Reserve</dt><dd>{a.reservePrice ? formatPHP(a.reservePrice) : "None"}</dd></div>
              <div className="flex justify-between"><dt className="text-cream-muted">Listed price</dt><dd>{product ? formatPHP(product.price) : "—"}</dd></div>
              <div className="flex justify-between border-t border-gold/10 pt-1.5"><dt className="text-cream-muted">High bid</dt><dd className="text-gold-light">{top ? formatPHP(top.amount) : "—"}</dd></div>
              {phase === "live" && <div className="flex justify-between"><dt className="text-cream-muted">Next bid from</dt><dd>{formatPHP(nextMinBid(a))}</dd></div>}
              {a.reservePrice && top && phase === "live" && <p className="pt-1 text-xs text-cream-dim">{top.amount >= a.reservePrice ? "Reserve met." : "Reserve not met yet."}</p>}
            </dl>
          </Card>
          {phase === "ended" && (
            <Card title="Result">
              {winner ? (
                <p className="text-sm text-cream">
                  Won by <span className="text-gold-light">{winner.contact.fullName || winner.bidderName}</span> at {formatPHP(winner.amount)}.
                  {order && <> <Link href={`/admin/orders/${order}`} className="text-gold-light underline">Open order {order}</Link></>}
                </p>
              ) : (
                <p className="text-sm text-cream-muted">{top ? "Reserve not met — the piece is back on sale." : "No bids — the piece is back on sale."}</p>
              )}
            </Card>
          )}
          <Card title="Share">
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton path={`/bidding/${a.id}`} />
              <Link href={`/bidding/${a.id}`} target="_blank" className="inline-flex h-10 items-center border border-gold/40 px-4 text-xs uppercase tracking-wider text-cream hover:border-gold">View bidding page</Link>
            </div>
          </Card>
          {(phase === "live" || phase === "scheduled") && <CancelAuctionButton id={a.id} bids={a.bids.length} />}
        </div>
      </div>
    </>
  );
}
