"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const STEP_MS = 1100;
const MAX_SLIDES = 6;
// Only one card plays at a time: starting one tells the others to stop.
const EVENT = "hl:card-slideshow";

/**
 * Product card photo that flips through the piece's photos while a mouse hovers it,
 * or after it's touched (e.g. while scrolling on a phone). A touch plays one round,
 * then returns to the cover; scrolling the card out of view stops it too.
 */
export function CardSlideshow({ images, title, priority, sold }: { images: { url: string; alt: string }[]; title: string; priority?: boolean; sold?: boolean }) {
  const slides = images.slice(0, MAX_SLIDES);
  const id = React.useId();
  const box = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<"off" | "hover" | "touch">("off");
  const [index, setIndex] = React.useState(0);
  // Extra photos are only loaded once the card has been played.
  const [loaded, setLoaded] = React.useState(false);
  const multi = slides.length > 1;

  const start = React.useCallback(
    (m: "hover" | "touch") => {
      if (!multi) return;
      setLoaded(true);
      setMode(m);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
    },
    [id, multi],
  );
  const stop = React.useCallback(() => {
    setMode("off");
    setIndex(0);
  }, []);

  React.useEffect(() => {
    const other = (e: Event) => (e as CustomEvent).detail !== id && stop();
    window.addEventListener(EVENT, other);
    return () => window.removeEventListener(EVENT, other);
  }, [id, stop]);

  React.useEffect(() => {
    if (mode === "off") return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % slides.length;
        // A touch plays one round, then settles back on the cover.
        if (next === 0 && mode === "touch") setMode("off");
        return next;
      });
    }, STEP_MS);
    return () => clearInterval(t);
  }, [mode, slides.length]);

  React.useEffect(() => {
    if (mode === "off" || !box.current) return;
    const io = new IntersectionObserver(([e]) => e.intersectionRatio < 0.35 && stop(), { threshold: [0, 0.35] });
    io.observe(box.current);
    return () => io.disconnect();
  }, [mode, stop]);

  if (!slides.length) return null;
  const imgCls = cn("object-cover transition-[opacity,transform] duration-500 ease-out group-hover:scale-105", sold && "grayscale-[40%]");

  return (
    <div
      ref={box}
      className="absolute inset-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && start("hover")}
      onPointerLeave={(e) => e.pointerType === "mouse" && stop()}
      onTouchStart={() => start("touch")}
    >
      {slides.map((s, i) =>
        i === 0 || loaded ? (
          <Image
            key={s.url + i}
            src={s.url}
            alt={i === 0 ? s.alt || title : ""}
            fill
            priority={i === 0 && priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 70vw"
            className={cn(imgCls, i === index ? (sold ? "opacity-60" : "opacity-100") : "opacity-0")}
            unoptimized={s.url.endsWith(".svg")}
          />
        ) : null,
      )}
      {multi && mode !== "off" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-[2] flex justify-center gap-1 sm:bottom-11" aria-hidden>
          {slides.map((s, i) => (
            <span key={s.url + i} className={cn("h-1.5 rounded-full shadow transition-all duration-300", i === index ? "w-4 bg-white" : "w-1.5 bg-white/60")} />
          ))}
        </div>
      )}
    </div>
  );
}
