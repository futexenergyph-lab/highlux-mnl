"use server";
import { redirect } from "next/navigation";
import { getOrderRepo } from "@/lib/orders/repo";

export type TrackState = { error: string } | null;

export async function trackOrderAction(_prev: TrackState, form: FormData): Promise<TrackState> {
  const number = String(form.get("orderNumber") ?? "").trim().toUpperCase().replace(/^(?!HLX-)(\d+)$/, "HLX-$1");
  const email = String(form.get("email") ?? "").trim();
  if (!number || !email) return { error: "Enter your order number and email." };
  const repo = await getOrderRepo();
  const found = await repo.findOrderNumber(number, email);
  // Same message either way, so order numbers can't be probed.
  if (!found) return { error: "We couldn't find an order with those details." };
  redirect(`/orders/${found.orderNumber}?t=${found.accessToken}`);
}
