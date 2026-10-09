import { ORDER_STATUS_LABELS, hasPendingProof, type OrderDetail, type OrderStatus } from "@/lib/orders/types";
import { Badge } from "./ui";

export function effectiveOrderStatus(o: OrderDetail): OrderStatus {
  return o.status === "pending_payment" && o.holdExpiresAt && new Date(o.holdExpiresAt) < new Date() ? "expired" : o.status;
}

const TONE: Record<OrderStatus, "gold" | "green" | "red" | "muted" | "blue"> = {
  pending_payment: "gold",
  layaway: "blue",
  paid: "green",
  packed: "green",
  shipped: "blue",
  delivered: "muted",
  cancelled: "red",
  expired: "red",
};

export function OrderBadges({ order }: { order: OrderDetail }) {
  const s = effectiveOrderStatus(order);
  return (
    <span className="inline-flex flex-wrap gap-1">
      <Badge tone={TONE[s]}>{ORDER_STATUS_LABELS[s]}</Badge>
      {hasPendingProof(order) && <Badge tone="gold">Proof to verify</Badge>}
      {order.needsReview && <Badge tone="red">Needs review</Badge>}
    </span>
  );
}
