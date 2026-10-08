"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SearchOverlay } from "./search-overlay";
import { MobileNav } from "./mobile-nav";
import { useCart } from "@/components/cart/cart-provider";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { NAV, brandsFor, categoryBySlug } from "@/lib/catalog";
import { cn } from "@/lib/utils";

const iconBtn =
  "relative inline-flex h-10 w-10 items-center justify-center text-cream transition-colors hover:text-gold-light focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold";

function CartButton() {
  const { count } = useCart();
  return (
    <Link href="/cart" className={iconBtn} aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
      <ShoppingBag className="h-[22px] w-[22px] lg:h-6 lg:w-6" strokeWidth={1.1} />
      <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-gradient px-1 font-sans text-[0.62rem] font-bold text-ink">
        {count}
      </span>
    </Link>
  );
}

function WishlistLink() {
  const { wishlist } = useWishlist();
  return (
    <Link href="/wishlist" className={cn(iconBtn, "hidden md:inline-flex")} aria-label={`Wishlist, ${wishlist.length} saved`}>
      <Heart className="h-[22px] w-[22px] lg:h-6 lg:w-6" strokeWidth={1.1} />
      {wishlist.length > 0 && (
        <span className="absolute right-0.5 top-1 h-2 w-2 rounded-full bg-gold" aria-hidden />
      )}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-500",
        scrolled ? "border-gold/20 bg-ink/95 shadow-luxe backdrop-blur-md" : "border-gold/10 bg-ink",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4 lg:h-[88px]">
        {/* Mobile: hamburger */}
        <div className="flex w-20 lg:hidden">
          <MobileNav
            trigger={
              <button className={cn(iconBtn, "-ml-2")} aria-label="Open menu">
                <Menu className="h-6 w-6" strokeWidth={1.1} />
              </button>
            }
          />
        </div>

        <Logo className="lg:items-center" />

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-6 xl:gap-9">
            {NAV.map((item) => {
              const cat = item.category ? categoryBySlug(item.category) : undefined;
              return (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-1.5 py-8 font-sans text-[0.78rem] font-medium uppercase tracking-[0.14em] transition-colors hover:text-gold-light",
                      isActive(item.href) ? "text-cream" : "text-cream/85",
                    )}
                    aria-haspopup={cat ? "true" : undefined}
                  >
                    {item.label}
                    {cat && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />}
                    <span
                      className={cn(
                        "absolute bottom-6 left-0 h-px bg-cream transition-all duration-300",
                        isActive(item.href) ? "w-full" : "w-0 group-hover:w-full group-hover:bg-gold",
                        cat && "right-5",
                      )}
                    />
                  </Link>

                  {cat && (
                    <div className="invisible absolute left-1/2 top-full z-50 w-[520px] -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-300 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="grid grid-cols-2 gap-8 border border-gold/25 bg-ink p-8 shadow-luxe backdrop-blur-md">
                        <div>
                          <p className="eyebrow mb-4 text-gold">Shop by type</p>
                          <ul className="space-y-2.5">
                            <li>
                              <Link href={`/${cat.slug}`} className="font-serif text-lg text-cream hover:text-gold-light">
                                All {cat.name}
                              </Link>
                            </li>
                            {cat.subCategories.map((s) => (
                              <li key={s.slug}>
                                <Link href={`/${cat.slug}?type=${s.slug}`} className="font-sans text-sm text-cream-muted transition hover:pl-1 hover:text-gold-light">
                                  {s.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="eyebrow mb-4 text-gold">Brands</p>
                          <ul className="space-y-2.5">
                            {brandsFor(cat.slug).slice(0, 9).map((b) => (
                              <li key={b.slug}>
                                <Link href={`/${cat.slug}?brand=${b.slug}`} className="font-sans text-sm text-cream-muted transition hover:pl-1 hover:text-gold-light">
                                  {b.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex w-20 items-center justify-end gap-0 sm:gap-1 lg:w-auto lg:gap-2 xl:gap-3">
          <SearchOverlay
            trigger={
              <button className={iconBtn} aria-label="Search">
                <Search className="h-[22px] w-[22px] lg:h-6 lg:w-6" strokeWidth={1.1} />
              </button>
            }
          />
          <Link href="/account" className={cn(iconBtn, "hidden sm:inline-flex")} aria-label="Account">
            <User className="h-[22px] w-[22px] lg:h-6 lg:w-6" strokeWidth={1.1} />
          </Link>
          <WishlistLink />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
