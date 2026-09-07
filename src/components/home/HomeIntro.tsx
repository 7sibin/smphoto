"use client";

import { useEffect, useState } from "react";

/**
 * Uvodna zavjesa sa naslovne. Dizajn je vozi cistim CSS-om, sa
 * animation: loadHide 0s linear 2.05s forwards. Ovdje je na state-u iz dva
 * razloga:
 *
 *  1. Ako animacija ne krene — reduced motion, ugasen CSS, stara mobilna
 *     preglednika — cista CSS varijanta ostavi fiksiran sloj preko cijele
 *     stranice. Timeout se izvrsi svakako.
 *  2. Vrti se jednom po kartici. Bez toga svaki povratak na "Naslovna"
 *     ponovo ceka dvije sekunde.
 */

const SEEN_KEY = "sm.intro";
const TOTAL_MS = 2050;

export function HomeIntro() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — onda se vrti svaki put, sto je i dalje ispravno */
    }
    if (seen) return;

    setShow(true);
    const id = window.setTimeout(() => setShow(false), TOTAL_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;

  return (
    <div className="intro" aria-hidden="true">
      <span className="half half-top" />
      <span className="half half-bottom" />
      <span className="badge">
        <span className="ring">SM</span>
        <span className="bar" />
        <span className="exif">1/500 · f/1.4 · iso 200</span>
      </span>

      <style jsx>{`
        .intro {
          position: fixed;
          inset: 0;
          z-index: 60;
          pointer-events: none;
        }
        .half {
          position: absolute;
          left: 0;
          right: 0;
          height: 50.2%;
          background: var(--night);
        }
        .half-top {
          top: 0;
          animation: gdLoadUp 0.72s cubic-bezier(0.76, 0, 0.24, 1) 1.32s both;
        }
        .half-bottom {
          bottom: 0;
          animation: gdLoadDown 0.72s cubic-bezier(0.76, 0, 0.24, 1) 1.32s both;
        }
        .badge {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 22px;
          animation: gdLoadOut 0.26s ease 1.14s both;
        }
        .ring {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 112px;
          height: 112px;
          border: 1px solid rgba(245, 243, 238, 0.8);
          border-radius: 50%;
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 600;
          font-size: 24px;
          text-indent: 0.16em;
          text-transform: uppercase;
          color: var(--bg);
          animation: gdLoadFocus 1.15s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .bar {
          display: block;
          width: 112px;
          height: 2px;
          background: var(--red);
          transform-origin: left;
          animation: gdLoadBar 1.15s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .exif {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--bg);
        }
        @media (min-width: 700px) {
          .ring,
          .bar {
            width: 132px;
          }
          .ring {
            height: 132px;
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}
