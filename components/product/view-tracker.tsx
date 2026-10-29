"use client";
import * as React from "react";

/** Counts a product view once per browser session (refreshes and back/forward don't add more). */
export function ViewTracker({ productId, kind = "product" }: { productId: string; kind?: "product" | "auction" }) {
  React.useEffect(() => {
    const key = `hlx-viewed:${kind}:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch(kind === "auction" ? `/api/bidding/${productId}/view` : `/api/products/${productId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [productId, kind]);
  return null;
}
