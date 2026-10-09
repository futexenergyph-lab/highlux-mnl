"use client";
import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Wishlist + recently viewed, kept in localStorage as product IDs (fresh
 * price/status is fetched when rendered). When the customer is signed in, the
 * wishlist is merged with their account's and every change is saved there too.
 * Also exposes who is signed in, so static pages can personalise client-side.
 */
interface Ctx {
  wishlist: string[];
  recent: string[];
  /** False until localStorage has been read (avoids treating "not loaded" as "empty"). */
  ready: boolean;
  /** Signed-in customer (null for guests / until the session probe returns). */
  account: { name: string; email: string } | null;
  signedIn: boolean;
  isWished: (id: string) => boolean;
  toggleWish: (id: string) => void;
  trackView: (id: string) => void;
}

const WishlistCtx = React.createContext<Ctx | null>(null);
const WISH_KEY = "highlux.wishlist.v1";
const RECENT_KEY = "highlux.recent.v1";
const RECENT_MAX = 12;

function read(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function sync(change: { add?: string[]; remove?: string[] }) {
  fetch("/api/account/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(change) }).catch(() => {});
}

function write(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [ready, setReady] = React.useState(false);
  const [account, setAccount] = React.useState<Ctx["account"]>(null);
  const signedInRef = React.useRef(false);

  React.useEffect(() => {
    setWishlist(read(WISH_KEY));
    setRecent(read(RECENT_KEY));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === WISH_KEY) setWishlist(read(WISH_KEY));
      if (e.key === RECENT_KEY) setRecent(read(RECENT_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** Ask the server who's signed in; merge wishlists on sign-in, reset on sign-out. */
  const probe = React.useCallback(() => {
    fetch("/api/account/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { user: Ctx["account"]; wishlist: string[] }) => {
        if (!s.user) {
          if (signedInRef.current) setWishlist(read(WISH_KEY)); // signed out: device list (cleared on sign-out)
          signedInRef.current = false;
          setAccount(null);
          return;
        }
        signedInRef.current = true;
        setAccount(s.user);
        // Merge this device's list with the account's (device-only items are uploaded).
        const local = read(WISH_KEY);
        const upload = local.filter((id) => !s.wishlist.includes(id));
        const merged = [...upload, ...s.wishlist];
        write(WISH_KEY, merged);
        setWishlist(merged);
        if (upload.length) sync({ add: upload });
      })
      .catch(() => {});
  }, []);

  // Probe on first load, and after leaving the sign-in or account pages: sign-in
  // and sign-out navigate client-side, so this provider doesn't remount.
  const pathname = usePathname();
  const prevPath = React.useRef<string | null>(null);
  React.useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    if (prev === null || /^\/(login|account)(\/|$)/.test(prev)) probe();
  }, [pathname, probe]);

  const toggleWish = React.useCallback((id: string) => {
    // Read from storage, not state: callers' effects can run before the load effect above.
    const prev = read(WISH_KEY);
    const removing = prev.includes(id);
    const next = removing ? prev.filter((x) => x !== id) : [id, ...prev];
    write(WISH_KEY, next);
    setWishlist(next);
    if (signedInRef.current) sync(removing ? { remove: [id] } : { add: [id] });
  }, []);

  const trackView = React.useCallback((id: string) => {
    const next = [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, RECENT_MAX);
    write(RECENT_KEY, next);
    setRecent(next);
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ wishlist, recent, ready, account, signedIn: account !== null, isWished: (id) => wishlist.includes(id), toggleWish, trackView }),
    [wishlist, recent, ready, account, toggleWish, trackView],
  );
  return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}

export function useWishlist() {
  const ctx = React.useContext(WishlistCtx);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
