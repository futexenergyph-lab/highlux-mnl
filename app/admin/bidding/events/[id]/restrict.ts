import type { Modifier } from "@dnd-kit/core";

/** Keeps a dragged row moving up and down only. */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
