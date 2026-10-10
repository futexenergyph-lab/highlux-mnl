"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Gem, Home, Inbox, LayoutDashboard, Menu, Package, Receipt, Settings, Users, Wallet, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: Package, badge: "orders" as const },
  { href: "/admin/purchases", label: "Purchase Records", Icon: Receipt },
  { href: "/admin/products", label: "Products", Icon: Gem },
  { href: "/admin/layaway", label: "Layaway", Icon: Wallet },
  { href: "/admin/consignments", label: "Consignments", Icon: Inbox, badge: "consignments" as const },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/homepage", label: "Homepage", Icon: Home },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
];

interface Props {
  user: { name: string; email: string; role: string };
  badges: { proofs: number; toFulfil: number; consignments: number; review: number };
  children: React.ReactNode;
}

export function AdminShell({ user, badges, children }: Props) {
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => setOpen(false), [path]);
  const count = (b?: "orders" | "consignments") => (b === "orders" ? badges.proofs + badges.toFulfil + badges.review : b === "consignments" ? badges.consignments : 0);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, Icon, badge }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        const n = count(badge);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-3 border-l-2 px-4 py-2.5 text-sm transition-colors", active ? "border-gold bg-gold/[0.08] text-gold-light" : "border-transparent text-cream-muted hover:bg-cream/[0.03] hover:text-cream")}
          >
            <Icon className="h-4 w-4" strokeWidth={1.4} />
            <span className="flex-1">{label}</span>
            {n > 0 && <span className="rounded-full bg-gold px-1.5 py-0.5 text-[0.6rem] font-bold leading-none text-ink">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-200">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gold/15 bg-ink px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="-ml-1 p-2 text-cream"><Menu className="h-5 w-5" /></button>
        <span className="font-serif tracking-[0.14em] text-gold-light">HIGHLUX · ADMIN</span>
        <Link href="/" className="p-2 text-cream-muted" aria-label="View store"><ExternalLink className="h-4 w-4" /></Link>
      </header>

      {open && <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gold/15 bg-ink transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between border-b border-gold/15 px-5 py-5">
          <Link href="/admin" className="leading-tight">
            <span className="text-gold-gradient block font-serif text-lg tracking-[0.14em]">HIGHLUX MNL</span>
            <span className="text-[0.6rem] uppercase tracking-[0.24em] text-cream-dim">Admin</span>
          </Link>
          <button onClick={() => setOpen(false)} className="text-cream-muted lg:hidden" aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{nav}</div>
        <div className="border-t border-gold/15 p-4 text-xs">
          <p className="truncate text-cream">{user.name}</p>
          <p className="truncate text-cream-dim">{user.email} · {user.role}</p>
          <Link href="/" className="mt-3 inline-flex items-center gap-1.5 text-gold-light hover:underline">View store <ExternalLink className="h-3 w-3" /></Link>
        </div>
      </aside>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
