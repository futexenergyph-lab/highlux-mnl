"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "./restrict";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";
import { reorderLotsAction } from "../../actions";

function Row({ id, index, children }: { id: string; index: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative flex items-center gap-1 bg-ink ${isDragging ? "z-10 shadow-luxe ring-1 ring-gold/40" : ""}`}
    >
      {children}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none p-2 text-cream-muted hover:text-cream active:cursor-grabbing"
        aria-label={`Drag to move item ${index + 1}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </li>
  );
}

/** The event's pieces with a drag handle beside ⋮; dropping saves the order and renumbers the Item #s. */
export function SortableLots({ eventId, rows }: { eventId: string; rows: { id: string; node: React.ReactNode }[] }) {
  const router = useRouter();
  const [order, setOrder] = React.useState(() => rows.map((r) => r.id));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const key = rows.map((r) => r.id).join(",");
  React.useEffect(() => setOrder(key ? key.split(",") : []), [key]);
  const byId = new Map(rows.map((r) => [r.id, r.node]));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const prev = order;
    const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
    setOrder(next);
    setSaving(true);
    setError(null);
    const res = await reorderLotsAction(eventId, next);
    setSaving(false);
    if (res.error) {
      setOrder(prev);
      setError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <>
      <p className="mb-2 flex items-center gap-1.5 text-xs text-cream-dim">
        {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving new order…</> : <>Hold and drag <GripVertical className="inline h-3.5 w-3.5" /> to change the order. Item #s follow it.</>}
      </p>
      {error && <p role="alert" className="mb-2 border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-200">{error}</p>}
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="-mx-2 divide-y divide-gold/10">
            {order.map((id, i) => (byId.has(id) ? <Row key={id} id={id} index={i}>{byId.get(id)}</Row> : null))}
          </ul>
        </SortableContext>
      </DndContext>
    </>
  );
}
