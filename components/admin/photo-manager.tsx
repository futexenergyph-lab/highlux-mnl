"use client";
import * as React from "react";
import Image from "next/image";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { uploadFile } from "@/lib/client/upload";
import type { ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX = 15;

function Tile({ img, index, onRemove, onAlt, altHint }: { img: ProductImage; index: number; onRemove: () => void; onAlt: (alt: string) => void; altHint: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.url });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn("group relative border bg-ink-50", isDragging ? "z-10 border-gold shadow-gold-glow" : "border-gold/20")}>
      <div className="relative aspect-square">
        <Image src={img.url} alt={img.alt} fill sizes="160px" unoptimized className="object-cover" />
        {index === 0 && <span className="absolute left-1.5 top-1.5 flex items-center gap-1 bg-gold px-1.5 py-0.5 text-[0.55rem] font-bold uppercase text-ink"><Star className="h-2.5 w-2.5" /> Cover</span>}
        <button type="button" {...attributes} {...listeners} className="absolute right-1.5 top-1.5 cursor-grab touch-none bg-ink/80 p-1 text-cream active:cursor-grabbing" aria-label={`Drag to reorder photo ${index + 1}`}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onRemove} className="absolute bottom-1.5 right-1.5 bg-ink/80 p-1 text-cream hover:text-red-300" aria-label={`Remove photo ${index + 1}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input value={img.alt} onChange={(e) => onAlt(e.target.value)} placeholder={`${altHint}${index ? ` — photo ${index + 1}` : ""}`} aria-label={`Alt text for photo ${index + 1}`} className="w-full border-t border-gold/15 bg-transparent px-2 py-1.5 text-[0.7rem] text-cream placeholder:text-cream-dim/60 focus:outline-none" />
    </li>
  );
}

/** Drag-and-drop upload + reorder; first photo is the cover. */
export function PhotoManager({ images, onChange, defaultAlt, error }: { images: ProductImage[]; onChange: (imgs: ProductImage[]) => void; defaultAlt: string; error?: string }) {
  const altHint = defaultAlt;
  const [uploading, setUploading] = React.useState(0);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [over, setOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const latest = React.useRef(images);
  latest.current = images;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = async (files: File[]) => {
    setMsg(null);
    const room = MAX - latest.current.length;
    const picked = files.filter((f) => f.type.startsWith("image/")).slice(0, room);
    if (files.length > room) setMsg(`Only ${MAX} photos per piece — ${files.length - room} skipped.`);
    setUploading((n) => n + picked.length);
    // Upload in parallel; append in the order chosen as each finishes.
    const results = await Promise.all(
      picked.map((f) =>
        uploadFile("/api/admin/upload", f, { kind: "product" })
          .then((r) => r.url!)
          .catch((e: Error) => {
            setMsg(`${f.name}: ${e.message}`);
            return null;
          })
          .finally(() => setUploading((n) => n - 1)),
      ),
    );
    // Alt text left blank is filled from the product title on save.
    const added = results.filter((u): u is string => !!u).map((url) => ({ url, alt: "" }));
    onChange([...latest.current, ...added].slice(0, MAX));
  };

  const onDragEnd = ({ active, over: o }: DragEndEvent) => {
    if (!o || active.id === o.id) return;
    const from = images.findIndex((i) => i.url === active.id);
    const to = images.findIndex((i) => i.url === o.id);
    onChange(arrayMove(images, from, to));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          addFiles([...e.dataTransfer.files]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        className={cn("flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center text-sm transition-colors", over ? "border-gold bg-gold/10" : "border-gold/40 hover:border-gold", error && "border-red-400/60")}
      >
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <ImagePlus className="h-6 w-6 text-gold" strokeWidth={1.25} />}
        <span className="text-cream">{uploading ? `Uploading ${uploading}…` : "Drop photos here or click to choose"}</span>
        <span className="text-xs text-cream-dim">{images.length}/{MAX} · JPG, PNG, WEBP · resized automatically · drag tiles to reorder</span>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic" multiple className="sr-only" onChange={(e) => { addFiles([...(e.target.files ?? [])]); e.target.value = ""; }} />
      </div>
      {(msg || error) && <p className="mt-2 text-xs text-red-300">{msg ?? error}</p>}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.url)} strategy={rectSortingStrategy}>
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {images.map((img, i) => (
                <Tile
                  key={img.url}
                  img={img}
                  index={i}
                  onRemove={() => onChange(images.filter((x) => x.url !== img.url))}
                  onAlt={(alt) => onChange(images.map((x) => (x.url === img.url ? { ...x, alt } : x)))}
                  altHint={altHint}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
