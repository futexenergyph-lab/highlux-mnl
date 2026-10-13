"use client";
import * as React from "react";

/** Counts a product view once per browser session (refreshes and back/forward don't add more). */
export function ViewTracker({ productId }: { productId: string }) {
  React.useEffect(() => {
    const key = `hlx-viewed:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    fetch(`/api/products/${productId}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [productId]);
  return null;
}
