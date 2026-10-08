"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { BRANDS, productHref } from "@/lib/catalog";
import type { ProductSummary } from "@/lib/product-dto";
import { cn, formatPHP } from "@/lib/utils";

/** Instant search: debounced /api/search as you type; Enter goes to the full results page. */
export function SearchOverlay({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<ProductSummary[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const router = useRouter();

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((j) => {
          setResults(j.results);
          setActive(-1);
          setLoading(false);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const close = () => {
    setOpen(false);
    setQ("");
    setResults(null);
  };
  const goAll = (query: string) => {
    close();
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-50 max-h-[100dvh] overflow-y-auto border-b border-gold/25 bg-ink/95 pb-10 pt-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-top">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <div className="container max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (active >= 0 && results?.[active]) {
                  close();
                  router.push(productHref(results[active]));
                } else if (q.trim()) goAll(q);
              }}
              className="flex items-center gap-4 border-b border-gold/50 pb-3"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : <Search className="h-5 w-5 text-gold" strokeWidth={1.25} />}
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (!results?.length) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, -1));
                  }
                }}
                placeholder="Search brand, model, or category…"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent font-serif text-xl text-cream placeholder:text-cream-dim focus:outline-none sm:text-2xl"
              />
              <Dialog.Close className="text-cream-muted hover:text-gold-light" aria-label="Close search">
                <X className="h-5 w-5" strokeWidth={1.25} />
              </Dialog.Close>
            </form>

            {results ? (
              results.length ? (
                <>
                  <ul className="mt-4 divide-y divide-gold/10">
                    {results.map((p, i) => (
                      <li key={p.id}>
                        <Link
                          href={productHref(p)}
                          onClick={close}
                          onMouseEnter={() => setActive(i)}
                          className={cn("flex items-center gap-4 px-2 py-3 transition-colors", i === active && "bg-gold/[0.07]")}
                        >
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden border border-gold/15">
                            {p.image && <Image src={p.image} alt="" fill sizes="56px" unoptimized={p.image.endsWith(".svg")} className="object-cover" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="eyebrow block text-[0.6rem] text-gold">{p.brand}</span>
                            <span className="block truncate font-serif text-cream">{p.model}</span>
                          </span>
                          <span className="shrink-0 text-right text-sm">
                            <span className={p.status === "sold" ? "text-cream-dim line-through" : "text-cream"}>{formatPHP(p.price)}</span>
                            {p.status !== "available" && <span className="block text-[0.6rem] uppercase tracking-wider text-gold">{p.status}</span>}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => goAll(q)} className="eyebrow mt-5 inline-flex items-center gap-2 text-gold-light hover:text-gold">
                    See all results for “{q.trim()}” <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <p className="mt-6 text-sm text-cream-muted">
                  No pieces match “{q.trim()}”.{" "}
                  <Link href="/contact" onClick={close} className="text-gold-light underline underline-offset-4">Ask us to source it</Link>
                </p>
              )
            ) : (
              <>
                <p className="eyebrow mt-6 text-cream-dim">Popular brands</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BRANDS.slice(0, 8).map((b) => (
                    <button
                      key={b.slug}
                      onClick={() => setQ(b.name)}
                      className="border border-gold/25 px-3 py-1.5 font-sans text-xs tracking-wider2 text-cream-muted transition hover:border-gold hover:text-gold-light"
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
