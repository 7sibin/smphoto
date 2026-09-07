"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/components/LangContext";
import { photoUrl, type Grant, type PhotoRef } from "@/lib/client";

type Props = {
  grant: Grant;
  photos: (PhotoRef | null)[];
  index: number;
  locked: boolean;
  onIndex: (next: number) => void;
  onClose: () => void;
  onUnlock: () => void;
};

const SWIPE_PX = 50;

export function Lightbox({ grant, photos, index, locked, onIndex, onClose, onUnlock }: Props) {
  const { t } = useLang();
  const count = photos.length;
  const photo = photos[index] ?? null;

  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex(Math.min(count - 1, index + 1));
      else if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, onIndex, onClose]);

  // Pozadina ne smije da se pomjera dok je lightbox otvoren.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const prevPhoto = index > 0 ? photos[index - 1] : null;
  const nextPhoto = index < count - 1 ? photos[index + 1] : null;

  return (
    <div className="lb" role="dialog" aria-modal="true">
      <button type="button" className="lb-scrim" onClick={onClose} aria-label={t("close")} />

      <div className="lb-top">
        <span className="counter">
          {index + 1} / {count}
        </span>
        <div className="lb-top-right">
          <span className="hint hint-desktop">{t("lbHintDesktop")}</span>
          <span className="hint hint-mobile">{t("lbHintMobile")}</span>
          <button type="button" className="round" onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </div>
      </div>

      <div
        className="stage"
        onTouchStart={(e) => {
          const p = e.touches[0]!;
          touch.current = { x: p.clientX, y: p.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const p = e.changedTouches[0]!;
          const dx = p.clientX - start.x;
          const dy = p.clientY - start.y;
          // Vertikalno prevlacenje je scroll namjera, ne promjena slike.
          if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
          onIndex(dx < 0 ? Math.min(count - 1, index + 1) : Math.max(0, index - 1));
        }}
      >
        {photo ? (
          <figure key={photo.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(grant, photo.id, 1400)} alt="" draggable={false} />
          </figure>
        ) : (
          <div className="stage-skel shimmer" />
        )}
      </div>

      {/* Susjedi se povlace unaprijed da swipe ne ceka mrezu. */}
      <div className="preload" aria-hidden="true">
        {prevPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(grant, prevPhoto.id, 1400)} alt="" />
        )}
        {nextPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl(grant, nextPhoto.id, 1400)} alt="" />
        )}
      </div>

      <button
        type="button"
        className="nav nav-prev"
        onClick={() => onIndex(Math.max(0, index - 1))}
        disabled={index === 0}
        aria-label="←"
      >
        ←
      </button>
      <button
        type="button"
        className="nav nav-next"
        onClick={() => onIndex(Math.min(count - 1, index + 1))}
        disabled={index >= count - 1}
        aria-label="→"
      >
        →
      </button>

      {locked && (
        <div className="lb-bottom">
          <span className="lb-note">{t("lbLockedNote")}</span>
          <button type="button" className="btn btn-primary lb-cta" onClick={onUnlock}>
            {t("unlockCta")}
          </button>
        </div>
      )}

      <style jsx>{`
        .lb {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: var(--night);
          animation: gdFade 0.25s ease both;
        }
        .lb-scrim {
          position: absolute;
          inset: 0;
          border: 0;
          background: transparent;
        }
        .lb-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 12px;
          padding-top: max(12px, env(safe-area-inset-top));
        }
        .counter {
          font-family: ui-monospace, monospace;
          font-size: 12px;
          letter-spacing: 0.16em;
          color: rgba(245, 243, 238, 0.75);
        }
        .lb-top-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .hint {
          font-family: ui-monospace, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(245, 243, 238, 0.5);
        }
        .hint-desktop {
          display: none;
        }
        .round {
          min-width: 48px;
          min-height: 48px;
          border: 1px solid rgba(245, 243, 238, 0.4);
          border-radius: 999px;
          background: transparent;
          color: #f5f3ee;
          font-size: 20px;
          line-height: 1;
        }
        .stage {
          position: absolute;
          inset: 66px 8px 96px;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: pan-y;
        }
        .stage :global(figure) {
          margin: 0;
          max-width: 100%;
          max-height: 100%;
          animation: gdFade 0.2s ease both;
        }
        .stage :global(img) {
          display: block;
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        .stage-skel {
          width: min(90%, 600px);
          aspect-ratio: 3 / 2;
        }
        .preload {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }
        .nav {
          position: absolute;
          top: 50%;
          z-index: 3;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border: 1px solid rgba(245, 243, 238, 0.4);
          border-radius: 999px;
          background: rgba(11, 10, 9, 0.5);
          color: #f5f3ee;
          font-size: 17px;
        }
        .nav:disabled {
          opacity: 0.25;
        }
        .nav:not(:disabled):hover {
          background: var(--red);
          border-color: var(--red);
        }
        .nav-prev {
          left: 10px;
        }
        .nav-next {
          right: 10px;
        }
        .lb-bottom {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 3;
          padding: 12px 12px calc(14px + env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }
        .lb-note {
          font-size: 13px;
          text-align: center;
          color: rgba(245, 243, 238, 0.7);
        }
        .lb-cta {
          min-height: 52px;
        }

        @media (min-width: 700px) {
          .lb-top {
            padding: 20px 32px;
          }
          .hint-desktop {
            display: block;
          }
          .hint-mobile {
            display: none;
          }
          .stage {
            inset: 78px 100px 104px;
          }
          .nav {
            width: 54px;
            height: 54px;
            font-size: 18px;
          }
          .nav-prev {
            left: 24px;
          }
          .nav-next {
            right: 24px;
          }
          .lb-bottom {
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 18px;
            padding: 18px 32px 24px;
          }
          .lb-cta {
            padding: 0 30px;
          }
        }
      `}</style>
    </div>
  );
}
