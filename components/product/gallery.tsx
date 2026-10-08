"use client";
import * as React from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Slide = { kind: "image"; url: string; alt: string } | { kind: "video"; url: string };

const isSvg = (u: string) => u.endsWith(".svg");

/** Desktop hover-zoom: the image scales 2× and follows the cursor. */
function HoverZoom({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  const [origin, setOrigin] = React.useState<string | null>(null);
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      onMouseLeave={() => setOrigin(null)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 55vw, 100vw"
        unoptimized={isSvg(src)}
        className="object-cover transition-transform duration-200 ease-out [@media(hover:hover)]:cursor-zoom-in"
        style={origin ? { transform: "scale(2)", transformOrigin: origin } : undefined}
      />
    </div>
  );
}

function VideoSlide({ url }: { url: string }) {
  return <video src={url} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />;
}

export function ProductGallery({ images, videoUrl, title, sold }: { images: ProductImage[]; videoUrl?: string | null; title: string; sold?: boolean }) {
  const slides: Slide[] = React.useMemo(
    () => [
      ...images.map((i) => ({ kind: "image" as const, url: i.url, alt: i.alt || title })),
      ...(videoUrl ? [{ kind: "video" as const, url: videoUrl }] : []),
    ],
    [images, videoUrl, title],
  );
  const [ref, api] = useEmblaCarousel({ loop: slides.length > 1 });
  const [index, setIndex] = React.useState(0);
  const [lightbox, setLightbox] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!slides.length) return <div className="aspect-square border border-gold/15 bg-ink-50" />;

  return (
    <div className="flex flex-col self-start lg:sticky lg:top-28 lg:grid lg:grid-cols-[84px_1fr] lg:items-start lg:gap-4">
      {/* Thumbnails (desktop: vertical rail) */}
      <ul className="no-scrollbar order-2 mt-3 flex gap-2 overflow-x-auto lg:order-1 lg:mt-0 lg:max-h-[640px] lg:flex-col lg:overflow-y-auto">
        {slides.map((s, i) => (
          <li key={i} className="shrink-0">
            <button
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show ${s.kind === "video" ? "video" : `photo ${i + 1}`}`}
              aria-current={i === index}
              className={cn("relative block h-16 w-16 overflow-hidden border transition-colors lg:h-[84px] lg:w-[84px]", i === index ? "border-gold" : "border-gold/15 opacity-70 hover:opacity-100")}
            >
              {s.kind === "image" ? (
                <Image src={s.url} alt="" fill sizes="84px" unoptimized={isSvg(s.url)} className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-ink-50"><Play className="h-5 w-5 text-gold" /></span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="relative order-1 lg:order-2">
        <div ref={ref} className={cn("overflow-hidden border border-gold/15 bg-ink-50", sold && "opacity-80")}>
          <div className="flex touch-pan-y">
            {slides.map((s, i) => (
              <div key={i} className="relative aspect-square min-w-0 shrink-0 grow-0 basis-full" onClick={() => s.kind === "image" && setLightbox(true)}>
                {s.kind === "image" ? <HoverZoom src={s.url} alt={s.alt} priority={i === 0} /> : <VideoSlide url={s.url} />}
              </div>
            ))}
          </div>
        </div>

        {sold && (
          <span className="pointer-events-none absolute left-4 top-4 bg-cream px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-[0.24em] text-ink">Sold</span>
        )}
        <span className="pointer-events-none absolute bottom-4 left-4 bg-ink/70 px-2.5 py-1 font-sans text-[0.65rem] tracking-wider2 text-cream backdrop-blur">
          {index + 1} / {slides.length}
        </span>
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center bg-ink/70 text-cream backdrop-blur hover:text-gold-light"
          aria-label="View full screen"
        >
          <Expand className="h-4 w-4" strokeWidth={1.5} />
        </button>
        {slides.length > 1 && (
          <>
            <button onClick={() => api?.scrollPrev()} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center bg-ink/60 text-cream backdrop-blur hover:text-gold-light md:flex" aria-label="Previous photo">
              <ChevronLeft className="h-5 w-5" strokeWidth={1.25} />
            </button>
            <button onClick={() => api?.scrollNext()} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center bg-ink/60 text-cream backdrop-blur hover:text-gold-light md:flex" aria-label="Next photo">
              <ChevronRight className="h-5 w-5" strokeWidth={1.25} />
            </button>
          </>
        )}
      </div>

      <Lightbox open={lightbox} onOpenChange={setLightbox} slides={slides} start={index} onIndex={(i) => api?.scrollTo(i, true)} />
    </div>
  );
}

/** Full-screen viewer: swipe between photos; tap/click to zoom 2.5× then pan by scrolling/dragging. */
function Lightbox({ open, onOpenChange, slides, start, onIndex }: { open: boolean; onOpenChange: (o: boolean) => void; slides: Slide[]; start: number; onIndex: (i: number) => void }) {
  const [zoomed, setZoomed] = React.useState(false);
  const [ref, api] = useEmblaCarousel({ loop: slides.length > 1, startIndex: start, watchDrag: !zoomed });
  const [index, setIndex] = React.useState(start);
  const scrollers = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    if (!api) return;
    api.reInit({ watchDrag: !zoomed });
  }, [api, zoomed]);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setIndex(api.selectedScrollSnap());
      setZoomed(false);
      onIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onIndex]);

  React.useEffect(() => {
    if (open) {
      setZoomed(false);
      api?.scrollTo(start, true);
    }
  }, [open, start, api]);

  const toggleZoom = (i: number, e?: React.MouseEvent) => {
    const el = scrollers.current[i];
    if (!zoomed && el && e) {
      const r = el.getBoundingClientRect();
      const fx = (e.clientX - r.left) / r.width;
      const fy = (e.clientY - r.top) / r.height;
      setZoomed(true);
      // After the image grows to 250%, centre the tapped point.
      requestAnimationFrame(() => {
        el.scrollLeft = fx * el.scrollWidth - r.width / 2;
        el.scrollTop = fy * el.scrollHeight - r.height / 2;
      });
    } else setZoomed(!zoomed);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black" />
        <Dialog.Content className="fixed inset-0 z-[60] flex flex-col focus:outline-none">
          <Dialog.Title className="sr-only">Photo viewer</Dialog.Title>
          <div className="flex items-center justify-between px-4 py-3 text-cream">
            <span className="font-sans text-xs tracking-wider2">{index + 1} / {slides.length}</span>
            <div className="flex items-center gap-1">
              {slides[index]?.kind === "image" && (
                <button onClick={() => toggleZoom(index)} className="flex h-10 w-10 items-center justify-center hover:text-gold-light" aria-label={zoomed ? "Zoom out" : "Zoom in"}>
                  {zoomed ? <ZoomOut className="h-5 w-5" strokeWidth={1.25} /> : <ZoomIn className="h-5 w-5" strokeWidth={1.25} />}
                </button>
              )}
              <Dialog.Close className="flex h-10 w-10 items-center justify-center hover:text-gold-light" aria-label="Close">
                <X className="h-6 w-6" strokeWidth={1.25} />
              </Dialog.Close>
            </div>
          </div>
          <div ref={ref} className="min-h-0 flex-1 overflow-hidden">
            <div className="flex h-full">
              {slides.map((s, i) => (
                <div key={i} className="relative h-full min-w-0 shrink-0 grow-0 basis-full">
                  {s.kind === "image" ? (
                    <div
                      ref={(el) => {
                        scrollers.current[i] = el;
                      }}
                      className={cn("h-full w-full", zoomed && i === index ? "overflow-auto" : "overflow-hidden")}
                      onClick={(e) => toggleZoom(i, e)}
                    >
                      <div className={cn("relative", zoomed && i === index ? "h-[250%] w-[250%] cursor-zoom-out" : "h-full w-full cursor-zoom-in")}>
                        <Image src={s.url} alt={s.alt} fill sizes="100vw" unoptimized={isSvg(s.url)} className="object-contain" />
                      </div>
                    </div>
                  ) : (
                    <VideoSlide url={s.url} />
                  )}
                </div>
              ))}
            </div>
          </div>
          {slides.length > 1 && !zoomed && (
            <div className="flex justify-center gap-2 py-4">
              {slides.map((_, i) => (
                <button key={i} onClick={() => api?.scrollTo(i)} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-gold" : "w-1.5 bg-cream/40")} aria-label={`Go to photo ${i + 1}`} />
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
