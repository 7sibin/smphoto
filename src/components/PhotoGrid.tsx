"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { photoUrl, type Grant, type PhotoRef } from "@/lib/client";

type Props = {
  grant: Grant;
  /** Duzina je photoCount od prve sekunde; nepopunjena mjesta su null. */
  photos: (PhotoRef | null)[];
  netDown: boolean;
  onOpen: (index: number) => void;
  /** Najveci indeks koji je trenutno u prozoru — okidac za sledecu stranu. */
  onWindow: (lastVisibleIndex: number) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

/** Odnos stranica plocice iz dizajna: tileH = cell * 0.68. */
const TILE_RATIO = 0.68;
const BUFFER_ROWS = 2;

export function PhotoGrid({ grant, photos, netDown, onOpen, onWindow, scrollRef }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);

  const count = photos.length;

  // Sirina se mjeri, ne pogadja — broj kolona zavisi od nje, a ne od breakpointa.
  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry!.contentRect.width));
    });
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  // Dvije kolone su iz dizajna za 375px. Bez srednjeg stepenika telefon
  // okrenut u stranu i prozor od 600px dobiju dvije plocice od 300px.
  const cols =
    width < 430 ? 2 : width < 640 ? 3 : Math.max(3, Math.min(8, Math.floor(width / 220)));
  const gap = width < 640 ? 4 : 8;
  const cell = cols > 0 && width > 0 ? Math.floor((width - gap * (cols - 1)) / cols) : 0;
  const tileH = Math.round(cell * TILE_RATIO);
  const rowH = tileH + gap;
  const rows = cell > 0 ? Math.ceil(count / cols) : 0;

  // 400 px pokriva plocicu i na 3x ekranu; 800 tek kad su kolone stvarno siroke.
  const srcWidth = cell > 420 ? 800 : 400;

  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el || rowH <= 0) return;
    const first = Math.max(0, Math.floor(el.scrollTop / rowH) - BUFFER_ROWS);
    const last = Math.min(
      Math.max(0, rows - 1),
      Math.ceil((el.scrollTop + el.clientHeight) / rowH) + BUFFER_ROWS,
    );
    setRange(([f, l]) => (f === first && l === last ? [f, l] : [first, last]));
  }, [rowH, rows, scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    recompute();
    el.addEventListener("scroll", recompute, { passive: true });
    return () => el.removeEventListener("scroll", recompute);
  }, [recompute, scrollRef]);

  // Roditelj saznaje dokle je prozor stigao, pa odlucuje da li da vuce stranu.
  useEffect(() => {
    if (rows === 0) return;
    onWindow(Math.min(count - 1, (range[1] + 1) * cols - 1));
  }, [range, cols, count, rows, onWindow]);

  const tiles: React.ReactNode[] = [];
  if (cell > 0) {
    for (let r = range[0]; r <= range[1]; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (i >= count) break;
        const photo = photos[i];
        tiles.push(
          <button
            type="button"
            key={i}
            className="tile"
            style={{
              left: c * (cell + gap),
              top: r * rowH,
              width: cell,
              height: tileH,
            }}
            onClick={() => onOpen(i)}
            aria-label={`${i + 1} / ${count}`}
          >
            {photo && !netDown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl(grant, photo.id, srcWidth)}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <span className={netDown ? "ph" : "ph shimmer"} />
            )}
          </button>,
        );
      }
    }
  }

  return (
    <div ref={gridRef} className="grid" style={{ height: rows * rowH }}>
      {tiles}

      <style jsx>{`
        .grid {
          position: relative;
          width: 100%;
        }
        .grid :global(.tile) {
          position: absolute;
          padding: 0;
          border: 0;
          background: var(--tile);
          overflow: hidden;
          transition: transform 0.18s ease;
        }
        .grid :global(.tile:hover) {
          transform: scale(1.02);
          z-index: 1;
        }
        .grid :global(.tile img) {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .grid :global(.ph) {
          display: block;
          width: 100%;
          height: 100%;
          background-color: var(--tile);
        }
      `}</style>
    </div>
  );
}
