import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ORDER_STATUS_LABELS, type OrderDetail, type OrderStatus } from "@/lib/orders/types";
import { cn, formatPHP } from "@/lib/utils";

export function displayStatus(o: OrderDetail): OrderStatus {
  if (o.status === "pending_payment" && o.holdExpiresAt && new Date(o.holdExpiresAt) < new Date()) return "expired";
  return o.status;
}

const TONE: Partial<Record<OrderStatus, string>> = {
  pending_payment: "border-gold/60 text-gold-light",
  layaway: "border-gold/60 text-gold-light",
  delivered: "border-cream/30 text-cream",
  expired: "border-red-400/40 text-red-300",
  cancelled: "border-red-400/40 text-red-300",
};

export function OrderRow({ order }: { order: OrderDetail }) {
  const status = displayStatus(order);
  const balance = Math.max(0, order.total - order.amountPaid);
  return (
    <Link href={`/orders/${order.orderNumber}`} className="group flex items-center gap-4 border border-gold/15 p-4 transition-colors hover:border-gold/50">
      <div className="flex -space-x-4">
        {order.items.slice(0, 3).map((i) => (
          <span key={i.productId} className="relative h-16 w-16 overflow-hidden border border-ink bg-ink-50">
            {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="64px" unoptimized={i.imageUrl.endsWith(".svg")} className="object-cover" />}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-sans text-sm text-cream">{order.orderNumber}</span>
          <span className={cn("border px-2 py-0.5 text-[0.6rem] uppercase tracking-wider", TONE[status] ?? "border-gold/30 text-cream-muted")}>{ORDER_STATUS_LABELS[status]}</span>
        </div>
        <p className="mt-1 truncate font-serif text-cream-muted">{order.items.map((i) => i.title).join(", ")}</p>
        <p className="mt-0.5 text-xs text-cream-dim">
          {new Date(order.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" })}
          {" · "}
          {formatPHP(order.total)}
          {balance > 0 && status !== "expired" && status !== "cancelled" && <span className="text-gold-light"> · {formatPHP(balance)} due</span>}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-cream-dim transition group-hover:translate-x-0.5 group-hover:text-gold-light" />
    </Link>
  );
}
