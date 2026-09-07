"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { Reveal } from "@/components/Reveal";
import { useLang } from "@/components/LangContext";
import { useHangRail } from "@/components/home/useHangRail";
import type { StringKey } from "@/lib/i18n";

/** Cetiri kadra okacena da se suse — redoslijed, nagib i visina iz dizajna. */
const SHOTS: { src: string; cap: StringKey; h: number }[] = [
  { src: "/1.webp", cap: "raftShot1", h: 360 },
  { src: "/2.webp", cap: "raftShot2", h: 320 },
  { src: "/3.webp", cap: "raftShot3", h: 340 },
  { src: "/4.webp", cap: "raftShot4", h: 330 },
];

export function RaftingSection() {
  const { t } = useLang();

  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const idx = useRef<HTMLSpanElement>(null);

  /* Skrol javlja napredak na svaki frame. Ide pravo u DOM, ne u state —
     setState na 60fps bi rerenderovao cijelu sekciju zbog jednog broja. */
  const onProgress = useCallback((p: number) => {
    hud.current?.style.setProperty("--p", String(p));
    const n = Math.min(SHOTS.length, Math.floor(p * SHOTS.length) + 1);
    const txt = String(n).padStart(2, "0");
    if (idx.current && idx.current.textContent !== txt) idx.current.textContent = txt;
  }, []);

  useHangRail({ wrap, track, onProgress });

  return (
    <section id="rafting" className="sec">
      <Reveal className="head">
        <div className="head-in">
          <div>
            <div className="idx">
              <span>01</span>
              <span className="hair" aria-hidden="true" />
              <span>{t("raftSeason")}</span>
            </div>
            <h2 className="display">
              {t("raftTitleA")}
              <br />
              {t("raftTitleB")}
            </h2>
          </div>
          <div className="lede">
            <p>{t("raftBody")}</p>
            <div className="strip-note">
              <span>{t("raftStrip")}</span>
              <span className="hair hair-dark" aria-hidden="true" />
              <span>04 / 640</span>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="line-wrap" ref={wrap}>
        <span className="wire" aria-hidden="true" />
        <div className="line" ref={track}>
          {SHOTS.map((s, i) => (
            <figure key={s.src} className="hang" data-hang={i}>
              <span className="peg" aria-hidden="true" />
              <span className="peg-cap" aria-hidden="true" />
              {/* Traka je vodoravni viewport, a lazy loading gleda samo sta
                  sijece ekran — na 375px je to slika i po. Ostale tri se ne bi
                  ni trazile dok ne uklize, pa bi okviri usli prazni. Zato se
                  traze odmah, ali niskim prioritetom: hero (/1.webp) i font
                  ostaju ispred njih u redu, a do sekcije 01 su vec u kesu. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt=""
                style={{ "--h": `${s.h}px` } as React.CSSProperties}
                fetchPriority="low"
                decoding="async"
              />
              <figcaption>
                <span>{t(s.cap)}</span>
                <span>Tara</span>
              </figcaption>
            </figure>
          ))}
        </div>
        {/* Brojac i linija napretka. Stoje samo dok traku vuce skrol; u
            rezervnom stanju (prevlacenje prstom) nema sta da ih hrani. */}
        <div className="hud" ref={hud} aria-hidden="true">
          <span className="hud-i" ref={idx}>
            01
          </span>
          <span className="hud-bar">
            <span className="hud-fill" />
          </span>
          <span>{String(SHOTS.length).padStart(2, "0")}</span>
        </div>
      </div>

      <Reveal className="foot">
        <div className="foot-in">
          <div className="facts">
            <span>{t("raftFact1")}</span>
            <span>{t("raftFact2")}</span>
            <span>{t("raftFact3")}</span>
          </div>
          <Link className="cta" href="/galerija/rafting">
            {t("raftCta")}
          </Link>
        </div>
      </Reveal>

      <style jsx>{`
        .sec {
          padding: 64px 0 60px;
          background: var(--bg);
        }
        .sec :global(.head) {
          padding-inline: var(--edge);
        }
        .head-in {
          display: grid;
          gap: 24px;
        }
        .idx {
          display: flex;
          align-items: baseline;
          gap: 14px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .hair {
          display: block;
          width: 40px;
          height: 1px;
          background: rgba(18, 17, 15, 0.4);
        }
        .hair-dark {
          width: 26px;
          background: var(--ink);
        }
        h2 {
          margin: 16px 0 0;
          font-size: clamp(38px, 9vw, 82px);
          line-height: 0.88;
        }
        .lede {
          display: grid;
          gap: 18px;
        }
        p {
          margin: 0;
          max-width: 44ch;
          font-size: 15px;
          line-height: 1.65;
          color: var(--body);
          text-wrap: pretty;
        }
        .strip-note {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.55);
        }

        .line-wrap {
          position: relative;
          margin-top: 48px;
        }
        /* Zica je zategnuta od ivice do ivice i ne mice se. Kad skrol vuce
           traku, stipaljke klize po njoj — kao po pravoj zici za susenje. */
        .wire {
          position: absolute;
          left: 0;
          right: 0;
          top: 8px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(18, 17, 15, 0) 0,
            rgba(18, 17, 15, 0.45) 6%,
            rgba(18, 17, 15, 0.45) 94%,
            rgba(18, 17, 15, 0) 100%
          );
        }
        /* Cetiri slike u red ne staju na 375px. Osnovno stanje je traka koja
           se prevlaci prstom, sa snap tackama — cist CSS, radi bez JS-a. Kad
           se GSAP ucita, stavlja data-rail i preuzima: sekcija se pinuje a
           vertikalni skrol vuce traku (vidi useHangRail). Od 1000px je red
           iz dizajna. */
        .line {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 22px var(--edge) 8px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .line::-webkit-scrollbar {
          display: none;
        }
        /* Isjecak stoji na wrap-u, ne na traci. Element koji nosi overflow
           nosi i svoj prozor za isijecanje, pa kad rail pomjeri .line
           transformom, prozor ode ulijevo zajedno sa njom — kadrovi koji
           treba da uklize ostaju vani i nikad se ne iscrtaju. Vidi se tacno
           onoliko koliko je stalo na prvi ekran, i skrol tu nista ne mijenja.
           Wrap miruje, pa njegov isjecak drzi ivicu ekrana. Ide clip a ne
           hidden: hidden bi napravio skrol kontejner i po y osi. */
        .line-wrap[data-rail] {
          overflow-x: clip;
        }
        .line-wrap[data-rail] .line {
          overflow-x: visible;
          scroll-snap-type: none;
          touch-action: pan-y;
          will-change: transform;
        }
        .hang {
          position: relative;
          margin: 0;
          flex: 0 0 auto;
          width: min(72vw, 320px);
          scroll-snap-align: center;
          padding: 12px 12px 36px;
          background: var(--field);
          box-shadow: 0 18px 34px -22px rgba(18, 17, 15, 0.5), 0 1px 0 rgba(18, 17, 15, 0.06);
          transform-origin: top center;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          animation: gdFade 0.85s ease both;
        }
        .hang[data-hang="0"] {
          transform: rotate(-2.4deg);
        }
        .hang[data-hang="1"] {
          transform: rotate(1.9deg);
          animation-delay: 0.12s;
        }
        .hang[data-hang="2"] {
          transform: rotate(-1.3deg);
          animation-delay: 0.24s;
        }
        .hang[data-hang="3"] {
          transform: rotate(2.6deg);
          animation-delay: 0.36s;
        }
        .hang[data-hang="0"]:hover {
          transform: rotate(-2.4deg) translateY(-8px);
        }
        .hang[data-hang="1"]:hover {
          transform: rotate(1.9deg) translateY(-8px);
        }
        .hang[data-hang="2"]:hover {
          transform: rotate(-1.3deg) translateY(-8px);
        }
        .hang[data-hang="3"]:hover {
          transform: rotate(2.6deg) translateY(-8px);
        }
        .peg {
          position: absolute;
          top: -19px;
          left: 50%;
          margin-left: -7px;
          width: 14px;
          height: 32px;
          background: var(--red);
          box-shadow: 0 2px 4px rgba(18, 17, 15, 0.35);
        }
        .peg-cap {
          position: absolute;
          top: -13px;
          left: 50%;
          margin-left: -9px;
          width: 18px;
          height: 3px;
          background: rgba(18, 17, 15, 0.35);
        }
        /* Odnos strana, ne fiksna visina: na 375px je fiksnih 320-360px
           pravilo karticu od ~410px koja pojede cijeli ekran. Visina iz
           dizajna (--h) se vraca od 1000px, gdje daje neravne donje ivice. */
        .hang img {
          display: block;
          width: 100%;
          aspect-ratio: 4 / 5;
          object-fit: cover;
        }
        figcaption {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 11px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .hud {
          display: none;
          align-items: center;
          gap: 14px;
          margin: 16px var(--edge) 0;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          color: var(--muted);
        }
        .line-wrap[data-rail] .hud {
          display: flex;
        }
        .hud-i {
          color: var(--ink);
        }
        .hud-bar {
          flex: 1;
          height: 1px;
          background: rgba(18, 17, 15, 0.18);
        }
        .hud-fill {
          display: block;
          width: 100%;
          height: 100%;
          background: var(--ink);
          transform: scaleX(var(--p, 0));
          transform-origin: left center;
        }

        .sec :global(.foot) {
          margin-top: 34px;
          padding-inline: var(--edge);
        }
        .foot-in {
          padding-top: 20px;
          border-top: 1px solid rgba(18, 17, 15, 0.18);
          display: grid;
          gap: 20px;
        }
        .facts {
          display: grid;
          gap: 10px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }
        /* .cta sjedi na <Link> — vidi komentar u SiteNav.tsx. */
        .foot-in :global(.cta) {
          display: inline-flex;
          align-items: center;
          justify-self: start;
          min-height: var(--tap);
          padding-bottom: 4px;
          border-bottom: 1px solid var(--ink);
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 600;
          font-size: 21px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .foot-in :global(.cta):hover {
          color: var(--red);
          border-bottom-color: var(--red);
        }

        @media (min-width: 700px) {
          .sec {
            padding: 88px 0 80px;
          }
          .head-in {
            grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
            gap: 46px;
            align-items: end;
          }
          .line-wrap {
            margin-top: 66px;
          }
          .foot-in {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 28px;
            flex-wrap: wrap;
          }
          .facts {
            grid-auto-flow: column;
            gap: 40px;
          }
        }

        @media (min-width: 1000px) {
          .line {
            gap: clamp(12px, 2.4vw, 30px);
            overflow-x: visible;
          }
          .hang {
            flex: 1 1 0;
            width: auto;
            min-width: 0;
            padding: 14px 14px 40px;
          }
          /* Neravne visine iz dizajna. Do 1000px su iskljucene jer bi
             odvojile stipaljke od zice. */
          .hang[data-hang="1"] {
            margin-top: 14px;
          }
          .hang[data-hang="2"] {
            margin-top: 4px;
          }
          .hang[data-hang="3"] {
            margin-top: 20px;
          }
          .hang img {
            aspect-ratio: auto;
            height: var(--h);
          }
          figcaption {
            left: 14px;
            right: 14px;
            bottom: 13px;
            font-size: 10px;
          }
        }
      `}</style>
    </section>
  );
}
