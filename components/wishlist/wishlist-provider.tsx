"use client";
import * as React from "react";

/**
 * Wishlist + recently viewed, kept in localStorage as product IDs (fresh
 * price/status is fetched when rendered). Phase 4 syncs the wishlist to the
 * customer's account when signed in.
 */
interface Ctx {
  wishlist: string[];
  recent: string[];
  /** False until localStorage has been read (avoids treating "not loaded" as "empty"). */
  ready: boolean;
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
function write(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = React.useState<string[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [ready, setReady] = React.useState(false);

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

  const toggleWish = React.useCallback((id: string) => {
    // Read from storage, not state: callers' effects can run before the load effect above.
    const prev = read(WISH_KEY);
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
    write(WISH_KEY, next);
    setWishlist(next);
  }, []);

  const trackView = React.useCallback((id: string) => {
    const next = [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, RECENT_MAX);
    write(RECENT_KEY, next);
    setRecent(next);
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ wishlist, recent, ready, isWished: (id) => wishlist.includes(id), toggleWish, trackView }),
    [wishlist, recent, ready, toggleWish, trackView],
  );
  return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}

export function useWishlist() {
  const ctx = React.useContext(WishlistCtx);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
