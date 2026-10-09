"use client";
import * as React from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/**
 * The base script loads after hydration, so events fired on first render
 * (ViewContent from an ad click) would be lost. Wait up to ~6s for fbq.
 */
function withFbq(call: (fbq: Fbq) => void, tries = 60) {
  if (typeof window === "undefined") return;
  if (window.fbq) return call(window.fbq);
  if (tries > 0) setTimeout(() => withFbq(call, tries - 1), 100);
}

/** Fires a Pixel event and its Conversions API twin with the same event ID (Meta de-duplicates). */
export function trackMeta(event: "ViewContent" | "AddToCart" | "InitiateCheckout", data: { productIds: string[]; value: number; numItems?: number }) {
  if (!PIXEL_ID) return;
  const eventId = `${event}-${data.productIds.join("_").slice(0, 36)}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  withFbq((fbq) => fbq("track", event, { content_ids: data.productIds, content_type: "product", value: data.value, currency: "PHP", num_items: data.numItems ?? data.productIds.length }, { eventID: eventId }));
  fetch("/api/meta/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, eventId, url: window.location.href, productIds: data.productIds }),
    keepalive: true,
  }).catch(() => {});
}

/** Browser half of Purchase; the server sends the same event_id when payment is confirmed. Fires once per order. */
export function trackPurchase(orderId: string, value: number, productIds: string[]) {
  if (!PIXEL_ID) return;
  const key = `highlux.purchase.${orderId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {}
  withFbq((fbq) => fbq("track", "Purchase", { value, currency: "PHP", content_ids: productIds, content_type: "product", num_items: productIds.length }, { eventID: `purchase_${orderId}` }));
}

function PageViews() {
  const pathname = usePathname();
  const search = useSearchParams();
  const first = React.useRef(true);
  React.useEffect(() => {
    // The base snippet sends the first PageView; client-side navigations send the rest.
    if (first.current) {
      first.current = false;
      return;
    }
    window.fbq?.("track", "PageView");
  }, [pathname, search]);
  return null;
}

/** Meta Pixel base code — only loaded when NEXT_PUBLIC_META_PIXEL_ID is set. */
export function MetaPixel() {
  if (!PIXEL_ID) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's no-JS tracking pixel */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
      <React.Suspense fallback={null}>
        <PageViews />
      </React.Suspense>
    </>
  );
}

/** Drop into a server-rendered page to fire ViewContent once on mount. */
export function TrackViewContent({ productId, value }: { productId: string; value: number }) {
  React.useEffect(() => {
    trackMeta("ViewContent", { productIds: [productId], value });
  }, [productId, value]);
  return null;
}

export function TrackPurchase({ orderId, value, productIds }: { orderId: string; value: number; productIds: string[] }) {
  React.useEffect(() => {
    trackPurchase(orderId, value, productIds);
  }, [orderId, value, productIds]);
  return null;
}
