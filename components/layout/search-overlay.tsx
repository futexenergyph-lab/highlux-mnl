"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { BRANDS } from "@/lib/catalog";

/** Phase 1: query → /shop?q=. Phase 2 adds instant results. */
export function SearchOverlay({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const router = useRouter();

  const go = (query: string) => {
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-50 border-b border-gold/25 bg-ink/95 pb-10 pt-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-top">
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <div className="container max-w-3xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (q.trim()) go(q);
              }}
              className="flex items-center gap-4 border-b border-gold/50 pb-3"
            >
              <Search className="h-5 w-5 text-gold" strokeWidth={1.25} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search brand, model, or category…"
                className="flex-1 bg-transparent font-serif text-xl text-cream placeholder:text-cream-dim focus:outline-none sm:text-2xl"
              />
              <Dialog.Close className="text-cream-muted hover:text-gold-light" aria-label="Close search">
                <X className="h-5 w-5" strokeWidth={1.25} />
              </Dialog.Close>
            </form>
            <p className="eyebrow mt-6 text-cream-dim">Popular brands</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {BRANDS.slice(0, 8).map((b) => (
                <button
                  key={b.slug}
                  onClick={() => go(b.name)}
                  className="border border-gold/25 px-3 py-1.5 font-sans text-xs tracking-wider2 text-cream-muted transition hover:border-gold hover:text-gold-light"
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
