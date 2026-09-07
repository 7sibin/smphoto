"use client";

import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { CATEGORIES, TILE_COUNT, TILE_RATIOS, type CategorySlug } from "@/lib/categories";

/** Izlog kategorije. Plocice su maketa — vidi komentar u lib/categories.ts. */
export function CategoryGallery({ slug }: { slug: CategorySlug }) {
  const { t } = useLang();
  const cat = CATEGORIES[slug];

  const tiles = Array.from({ length: TILE_COUNT }, (_, i) => ({
    ratio: TILE_RATIOS[i % TILE_RATIOS.length]!,
    tone: cat.tones[i % cat.tones.length]!,
    name: `${cat.prefix}_${1240 + i * 7}`,
    delay: Math.min(i, 12) * 0.045,
  }));

  return (
    <div className="screen">
      <div className="head">
        <div>
          <span className="kicker">
            {t("catKicker")} · {t(cat.titleKey)}
          </span>
          {/* Naslov ulazi odozdo iza maske — vidi komentar u Hero.tsx. */}
          <span className="line">
            <h1 className="display title" key={slug}>
              {t(cat.titleKey)}
            </h1>
          </span>
        </div>
        <div className="aside">
          <p>{t(cat.descKey)}</p>
          <span className="count">
            {TILE_COUNT} {t("catPhotos")} · {t(cat.metaKey)}
          </span>
          {slug === "rafting" ? (
            <Link className="cta" href="/kod">
              {t("catRaftingCta")} →
            </Link>
          ) : null}
        </div>
      </div>

      <span className="rule" aria-hidden="true" />

      <p className="mock">{t("catPlaceholder")}</p>

      <div className="grid">
        {tiles.map((tile) => (
          <figure
            key={tile.name}
            className="tile"
            style={{
              aspectRatio: String(tile.ratio),
              backgroundColor: tile.tone,
              animationDelay: `${tile.delay}s`,
            }}
          >
            <figcaption>{tile.name}</figcaption>
          </figure>
        ))}
      </div>

      <style jsx>{`
        .screen {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .head {
          padding: 44px var(--edge) 26px;
          display: grid;
          gap: 26px;
        }
        .kicker {
          display: block;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.5);
        }
        .line {
          display: block;
          overflow: hidden;
          margin-top: 12px;
          padding: 0.2em 0 0.3em;
          margin-bottom: -0.3em;
        }
        .title {
          margin: 0;
          font-size: clamp(52px, 15vw, 150px);
          line-height: 0.82;
          letter-spacing: -0.02em;
          animation: gdRise 0.85s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .aside {
          display: grid;
          gap: 16px;
          justify-items: start;
        }
        p {
          margin: 0;
          max-width: 44ch;
          font-size: 16px;
          line-height: 1.6;
          color: var(--body);
          text-wrap: pretty;
        }
        .count {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.5);
        }
        /* .cta sjedi na <Link> — vidi komentar u SiteNav.tsx. */
        .aside :global(.cta) {
          display: inline-flex;
          align-items: center;
          min-height: var(--tap);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--red);
          border-bottom: 1px solid var(--red);
        }
        .aside :global(.cta):hover {
          color: var(--ink);
          border-bottom-color: var(--ink);
        }

        .rule {
          display: block;
          height: 1px;
          margin-inline: var(--edge);
          background: var(--ink);
          transform-origin: left;
          animation: gdRule 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }

        .mock {
          margin: 18px 0 0;
          padding-inline: var(--edge);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.38);
        }

        /* Masonry iz dizajna je column-count — plocice teku niz kolonu, pa
           break-inside drzi svaku u jednom komadu. */
        .grid {
          flex: 1;
          padding: 22px var(--edge) 72px;
          column-count: 2;
          column-gap: 10px;
        }
        .tile {
          position: relative;
          margin: 0 0 10px;
          break-inside: avoid;
          overflow: hidden;
          background-image: repeating-linear-gradient(
            112deg,
            rgba(18, 17, 15, 0.07) 0 2px,
            rgba(18, 17, 15, 0) 2px 15px
          );
          animation: gdReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        figcaption {
          position: absolute;
          left: 12px;
          bottom: 10px;
          opacity: 0;
          transition: opacity 0.25s ease;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(18, 17, 15, 0.62);
        }
        .tile:hover figcaption {
          opacity: 1;
        }

        @media (min-width: 700px) {
          .head {
            padding-block: 62px 30px;
            grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
            gap: 40px;
            align-items: end;
          }
          .aside {
            padding-bottom: 10px;
          }
          .grid {
            column-count: 3;
            column-gap: 12px;
          }
          .tile {
            margin-bottom: 12px;
          }
        }

        @media (min-width: 1400px) {
          .grid {
            column-count: 4;
          }
        }
      `}</style>
    </div>
  );
}
