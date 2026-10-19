import "server-only";
import { revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/data";
import { getOrderRepo } from "@/lib/orders/repo";
import { getCheckoutSettings } from "@/lib/checkout/settings";
import { orderUrl, sendEmail } from "@/lib/email";
import { formatPHP } from "@/lib/utils";
import { site } from "@/lib/site";
import { auctionHolder, getAuctionRepo } from "./repo";
import { auctionPhase, topBid, type Auction } from "./types";

export const AUCTION_NOTE = "Won at auction";

/**
 * Closes auctions whose time is up: the top bidder (if any, and at/above the reserve) gets an
 * unpaid order at the winning price; otherwise the piece goes back on sale. Safe to call from
 * any page — close() is atomic, so only one caller settles each auction.
 */
export async function settleDueAuctions(list?: Auction[]) {
  const repo = await getAuctionRepo();
  const all = list ?? (await repo.list());
  let changed = false;
  for (const a of all) {
    if (a.status !== "live" || auctionPhase(a) !== "ended") continue;
    const top = topBid(a);
    const won = !!top && (a.reservePrice == null || top.amount >= a.reservePrice);
    if (!(await repo.close(a.id, "ended", won ? top!.id : null))) continue;
    changed = true;
    if (!won) {
      await repo.releaseProduct(a.productId, a.id);
      continue;
    }
    try {
      await createWinnerOrder(a, top!);
    } catch (e) {
      console.error("auction winner order failed", a.id, e);
    }
  }
  if (changed) revalidateTag(CATALOG_TAG);
  return changed;
}

async function createWinnerOrder(a: Auction, top: NonNullable<ReturnType<typeof topBid>>) {
  const orders = await getOrderRepo();
  const [product] = await orders.getCheckoutProducts([a.productId]);
  if (!product) return;
  const settings = await getCheckoutSettings();
  const order = await orders.placeOrder({
    sessionId: auctionHolder(a.id),
    productIds: [a.productId],
    expectedSubtotal: product.price,
    holdMinutes: Math.max(60, settings.holds.bankTransferHours * 60),
    userId: top.userId,
    email: top.contact.email,
    fullName: top.contact.fullName || top.contact.email,
    phone: top.contact.phone,
    fulfillment: "pickup",
    shippingAddress: null,
    notes: `${AUCTION_NOTE} — delivery or meet-up to be arranged`,
    paymentMethod: "bank_transfer",
    paymentPlan: "full",
    shippingFee: 0,
    installments: [],
  });
  if (top.amount !== product.price) await orders.setAgreedPrice(order.id, top.amount);
  await (await getAuctionRepo()).setOrder(a.id, order.id);
  if (top.contact.email) {
    const url = orderUrl(order);
    await sendEmail(
      top.contact.email,
      `You won the auction: ${product.title} — ${site.name}`,
      `<p>Congratulations! Your bid of <strong>${formatPHP(top.amount)}</strong> won <strong>${product.title}</strong>.</p><p>Please complete payment within ${settings.holds.bankTransferHours} hours to secure it:</p><p><a href="${url}">${url}</a></p><p>We'll message you to arrange delivery or meet-up.</p><p>— ${site.name}</p>`,
    ).catch(() => {});
  }
}

/** Cancels a running auction and puts the piece back on sale. */
export async function cancelAuction(id: string) {
  const repo = await getAuctionRepo();
  const a = await repo.get(id);
  if (!a || a.status !== "live") return false;
  if (!(await repo.close(id, "cancelled"))) return false;
  await repo.releaseProduct(a.productId, a.id);
  revalidateTag(CATALOG_TAG);
  return true;
}
