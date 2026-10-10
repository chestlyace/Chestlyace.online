"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  categoriesOf,
  columnsFor,
  filterPieces,
  tileRatio,
} from "@/lib/creatives/gallery";
import type { PublicPiece } from "@/lib/creatives/data";
import { prefersReducedMotionNow } from "@/lib/media";
import { FilterBar } from "./FilterBar";
import { GalleryTile } from "./GalleryTile";
import { Lightbox } from "./Lightbox";
import { useCreativesText } from "@/components/creatives/useCreativesText";
import { useLang } from "@/components/shared/LangProvider";
import { plural } from "@/lib/i18n/format";

const GAP = 12;
const ROW = 4;

// The address's query, read from the window so the page can be rendered ahead of
// time (the server sees none; the browser reads it right after hydrating). Our own
// pushState/replaceState calls announce themselves, as the browser does not.
const URL_EVENT = "creatives:url";
function useQuery(): URLSearchParams {
  const search = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("popstate", onChange);
      window.addEventListener(URL_EVENT, onChange);
      return () => {
        window.removeEventListener("popstate", onChange);
        window.removeEventListener(URL_EVENT, onChange);
      };
    },
    () => window.location.search,
    () => "",
  );
  return useMemo(() => new URLSearchParams(search), [search]);
}

// The viewport's column count, from the same widths as the CSS columns below.
// During server rendering (and the first client render) it is 0: the grid then
// falls back to plain CSS columns until it is measured.
function useColumns(): number {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("resize", onChange);
      return () => window.removeEventListener("resize", onChange);
    },
    () => columnsFor(window.innerWidth),
    () => 0,
  );
}

// The Graphic design gallery (design.md §13.51–13.55): the filter bar, the masonry of
// tiles and the lightbox. The filter and the open piece live in the address
// (`?category=`, `?piece=`), so a view can be shared. The masonry is a CSS grid whose
// tiles span rows worked out from their ratios, so the tiles stay in reading order
// in the page and still fill the shortest column.
export function DesignGallery({ pieces }: { pieces: PublicPiece[] }) {
  const t = useCreativesText();
  const lang = useLang();
  const params = useQuery();
  const categories = useMemo(() => categoriesOf(pieces), [pieces]);
  const requested = params.get("category");
  const category = categories.some((c) => c.slug === requested)
    ? requested
    : null;
  const visible = useMemo(
    () => filterPieces(pieces, category),
    [pieces, category],
  );

  const pieceParam = params.get("piece");
  const open = pieces.find((p) => p.slug === pieceParam) ?? null;
  // The lightbox steps through what the filter shows, or everything for a
  // deep link to a piece the filter hides.
  const ring = open && visible.includes(open) ? visible : pieces;

  const columns = useColumns();
  const grid = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const flip = useRef<Flip.FlipState | null>(null);

  // The grid's width, to work out how tall each tile is.
  useLayoutEffect(() => {
    const element = grid.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const masonry = columns > 0 && width > 0;
  const columnWidth = masonry ? (width - (columns - 1) * GAP) / columns : 0;
  const spans = visible.map((piece) => {
    if (!masonry) return null;
    const height =
      columnWidth / tileRatio(piece.cover.width, piece.cover.height);
    return Math.ceil((height + GAP) / ROW);
  });

  // The tiles that stay glide to their new places; new ones fade in (§13.51).
  useLayoutEffect(() => {
    const state = flip.current;
    flip.current = null;
    if (!state || prefersReducedMotionNow()) return;
    gsap.registerPlugin(Flip);
    Flip.from(state, {
      duration: 0.5,
      ease: "power3.inOut",
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.3, stagger: 0.03 },
        ),
    });
  }, [category]);

  const update = useCallback(
    (changes: Record<string, string | null>, mode: "push" | "replace") => {
      const url = new URL(window.location.href);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) url.searchParams.delete(key);
        else url.searchParams.set(key, value);
      }
      window.history[mode === "push" ? "pushState" : "replaceState"](
        null,
        "",
        url,
      );
      window.dispatchEvent(new Event(URL_EVENT));
    },
    [],
  );

  const select = (slug: string | null) => {
    if (!prefersReducedMotionNow()) {
      gsap.registerPlugin(Flip);
      flip.current = Flip.getState("[data-flip-id]");
    }
    update({ category: slug }, "replace");
  };

  return (
    <div>
      {categories.length > 1 && (
        <FilterBar
          categories={categories}
          selected={category}
          total={pieces.length}
          onSelect={select}
        />
      )}
      <p aria-live="polite" className="sr-only">
        {plural(t.pieces, visible.length, lang)}
      </p>
      <div
        ref={grid}
        role="list"
        aria-label={t.designPieces}
        className={
          masonry
            ? "grid grid-flow-dense items-start"
            : "grid grid-cols-1 items-start gap-x-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        }
        style={
          masonry
            ? {
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridAutoRows: `${ROW}px`,
                columnGap: `${GAP}px`,
              }
            : undefined
        }
      >
        {visible.map((piece, index) => (
          <GalleryTile
            key={piece.slug}
            piece={piece}
            span={spans[index]}
            priority={index < 4}
            onOpen={(slug, from) => {
              setOrigin(from);
              update({ piece: slug }, "push");
            }}
          />
        ))}
      </div>
      {open && (
        <Lightbox
          pieces={ring}
          slug={open.slug}
          origin={origin}
          onStep={(slug) => {
            setOrigin(null);
            update({ piece: slug }, "replace");
          }}
          onClose={() => {
            setOrigin(null);
            update({ piece: null }, "replace");
          }}
        />
      )}
    </div>
  );
}
