"use client";
import * as React from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnOutline } from "./ui";

/**
 * Saves every product photo at full stored quality (the watermarked upload, up to 2000px).
 * Phones get the share sheet ("Save images" → Photos/Gallery); elsewhere each file downloads.
 */
/** Fetches every photo (full stored quality) and saves them: share sheet on phones, file downloads elsewhere. */
export async function downloadPhotos(images: { url: string }[], name: string): Promise<"done" | "cancelled"> {
  const files = await Promise.all(
    images.map(async (im, i) => {
      const res = await fetch(`/api/admin/photo?url=${encodeURIComponent(im.url)}`);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : blob.type.includes("svg") ? "svg" : "jpg";
      return new File([blob], `${name}-${String(i + 1).padStart(2, "0")}.${ext}`, { type: blob.type || "image/jpeg" });
    }),
  );
  if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return "done";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
    }
  }
  for (const f of files) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(f);
    a.download = f.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
    await new Promise((r) => setTimeout(r, 250));
  }
  return "done";
}

export function DownloadPhotosButton({ images, name }: { images: { url: string }[]; name: string }) {
  const [state, setState] = React.useState<"idle" | "busy" | "done" | "error">("idle");
  const run = async () => {
    setState("busy");
    try {
      const r = await downloadPhotos(images, name);
      if (r === "cancelled") return setState("idle");
      setState("done");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 3000);
  };
  return (
    <button type="button" onClick={run} disabled={state === "busy" || !images.length} className={cn(btnOutline, "w-full sm:w-auto")}>
      {state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
      {state === "busy" ? `Preparing ${images.length} photos…` : state === "done" ? "Photos saved" : state === "error" ? "Couldn't download — try again" : `Download photos (${images.length})`}
    </button>
  );
}
