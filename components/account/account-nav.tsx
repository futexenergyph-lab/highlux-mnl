"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { signOutAction } from "@/app/(store)/login/actions";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", Icon: LayoutGrid },
  { href: "/account/orders", label: "Orders", Icon: Package },
  { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
  { href: "/account/addresses", label: "Addresses", Icon: MapPin },
  { href: "/account/profile", label: "Profile", Icon: UserRound },
];

export function AccountNav({ name, email }: { name: string; email: string }) {
  const path = usePathname();
  return (
    <aside className="min-w-0 lg:sticky lg:top-28 lg:h-fit">
      <div className="flex items-center gap-3 border-b border-gold/15 pb-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-gradient font-serif text-lg text-ink">{name.charAt(0).toUpperCase()}</span>
        <div className="min-w-0">
          <p className="truncate font-serif text-lg text-cream">{name}</p>
          <p className="truncate text-xs text-cream-dim">{email}</p>
        </div>
      </div>
      <nav aria-label="Account" className="no-scrollbar -mx-4 mt-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
        {LINKS.map(({ href, label, Icon }) => {
          const active = href === "/account" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 border px-3 py-2.5 text-xs uppercase tracking-wider2 transition-colors lg:border-0 lg:border-l-2",
                active ? "border-gold text-gold-light lg:bg-gold/[0.06]" : "border-gold/15 text-cream-muted hover:text-cream lg:border-transparent",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.25} /> {label}
            </Link>
          );
        })}
        <form
          action={signOutAction}
          onSubmit={() => {
            // Shared devices: don't leave this account's wishlist behind.
            try {
              localStorage.removeItem("highlux.wishlist.v1");
            } catch {}
          }}
        >
          <button className="flex shrink-0 items-center gap-3 border border-gold/15 px-3 py-2.5 text-xs uppercase tracking-wider2 text-cream-muted hover:text-cream lg:mt-4 lg:border-0 lg:border-l-2 lg:border-transparent">
            <LogOut className="h-4 w-4" strokeWidth={1.25} /> Sign out
          </button>
        </form>
      </nav>
    </aside>
  );
}
