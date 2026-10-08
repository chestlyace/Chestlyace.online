"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { columnsFor, tileRatio } from "@/lib/creatives/gallery";

export const MASONRY_GAP = 12;
export const MASONRY_ROW = 4;

// The viewport's column count, from the same widths as the gallery's CSS columns.
// 0 during server rendering and the first client render: the grid then falls back
// to plain CSS columns until it is measured.
function useColumns(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => Math.min(3, columnsFor(window.innerWidth)),
    () => 0,
  );
}

// The masonry arithmetic of design.md §13.51 for a list of images: the grid's
// ref, its CSS (once measured) and the rows each tile spans. A narrow column
// count (at most 3) because the event page's pictures sit beside the sidebar.
export function useMasonry(
  images: readonly { width: number; height: number }[],
) {
  const grid = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const columns = useColumns();

  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const ready = columns > 0 && width > 0;
  const columnWidth = ready
    ? (width - (columns - 1) * MASONRY_GAP) / columns
    : 0;
  const spans = images.map((image) =>
    ready
      ? Math.ceil(
          (columnWidth / tileRatio(image.width, image.height) + MASONRY_GAP) /
            MASONRY_ROW,
        )
      : null,
  );
  return {
    grid,
    spans,
    ready,
    style: ready
      ? {
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: `${MASONRY_ROW}px`,
          columnGap: `${MASONRY_GAP}px`,
        }
      : undefined,
  };
}
