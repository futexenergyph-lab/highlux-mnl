"use client";
import * as React from "react";
import Link from "next/link";
import { ChevronDown, Heart, Package, User } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV, brandsFor, categoryBySlug } from "@/lib/catalog";
import { contactLinks } from "@/lib/site";
import { cn } from "@/lib/utils";

export function MobileNav({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetTitle className="border-b border-gold/20 px-6 py-5 font-serif text-xl tracking-[0.12em] text-gold-light">
          HIGHLUX MNL
        </SheetTitle>
        <nav aria-label="Mobile" className="flex-1 px-6 py-4">
          <ul className="divide-y divide-gold/10">
            {NAV.map((item) => {
              const cat = item.category ? categoryBySlug(item.category) : undefined;
              const isOpen = expanded === item.href;
              return (
                <li key={item.href} className="py-1">
                  <div className="flex items-center justify-between">
                    <SheetClose asChild>
                      <Link href={item.href} className="block flex-1 py-3 font-sans text-sm uppercase tracking-[0.16em] text-cream">
                        {item.label}
                      </Link>
                    </SheetClose>
                    {cat && (
                      <button
                        onClick={() => setExpanded(isOpen ? null : item.href)}
                        className="p-3 text-gold"
                        aria-expanded={isOpen}
                        aria-label={`${item.label} sub-menu`}
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  {cat && isOpen && (
                    <div className="grid grid-cols-2 gap-4 pb-4 pl-1 animate-in fade-in-0 slide-in-from-top-1">
                      <ul className="space-y-2.5">
                        {cat.subCategories.map((s) => (
                          <li key={s.slug}>
                            <SheetClose asChild>
                              <Link href={`/${cat.slug}?type=${s.slug}`} className="text-[0.82rem] text-cream-muted">
                                {s.name}
                              </Link>
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                      <ul className="space-y-2.5">
                        {brandsFor(cat.slug).slice(0, 7).map((b) => (
                          <li key={b.slug}>
                            <SheetClose asChild>
                              <Link href={`/${cat.slug}?brand=${b.slug}`} className="text-[0.82rem] text-cream-muted">
                                {b.name}
                              </Link>
                            </SheetClose>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="gold-divider my-6" />
          <ul className="space-y-1">
            {[
              { href: "/account", label: "My Account", Icon: User },
              { href: "/wishlist", label: "Wishlist", Icon: Heart },
              { href: "/track-order", label: "Track Order", Icon: Package },
            ].map(({ href, label, Icon }) => (
              <li key={href}>
                <SheetClose asChild>
                  <Link href={href} className="flex items-center gap-3 py-2.5 text-sm text-cream-muted hover:text-gold-light">
                    <Icon className="h-4 w-4 text-gold" strokeWidth={1.25} /> {label}
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-gold/20 p-6">
          <a href={contactLinks.messenger()} target="_blank" rel="noopener noreferrer" className="btn-gold w-full text-xs">
            Chat on Messenger
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
