"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/LangContext";
import { formatDate } from "@/lib/i18n";

type Row = { id: string; label: string; photoCount: number; startsAt: string };

/**
 * "Danas objavljeno" iz dizajna, na stvarnim podacima.
 *
 * Redovi su namjerno bez klika: bez koda nema sta da se otvori, a mrtav tap
 * na parkingu je gori od statickog reda. Ko je izgubio karticu ide na /dani.
 */
export function TodayFeed() {
  const { t } = useLang();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [dayLabel, setDayLabel] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const evRes = await fetch("/api/events");
        if (!evRes.ok) throw new Error("events");
        const { events } = (await evRes.json()) as {
          events: Array<{ id: string; date: string }>;
        };
        const latest = events[0];
        if (!latest) {
          if (alive) setRows([]);
          return;
        }

        const sRes = await fetch(`/api/events/${latest.id}/sessions`);
        if (!sRes.ok) throw new Error("sessions");
        const { sessions } = (await sRes.json()) as { sessions: Row[] };

        if (!alive) return;
        setDayLabel(formatDate(latest.date));
        setRows(sessions.filter((s) => s.photoCount > 0));
      } catch {
        if (alive) setFailed(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const total = rows?.reduce((a, r) => a + r.photoCount, 0) ?? 0;
  // Traka se vrti samo ako ima dovoljno redova da petlja ne bode oci.
  const ticker = (rows?.length ?? 0) >= 4;

  return (
    <aside className="feed">
      <div className="feed-head">
        <span className="display feed-title">{t("feedTitle")}</span>
        <span className="live">
          <span className="dot" aria-hidden="true" />
          <span className="mono">{t("feedLive")}</span>
        </span>
      </div>

      <div className="feed-body">
        <div className={ticker ? "track track-run" : "track"}>
          {rows === null && !failed && (
            <div className="row row-skel">
              <span className="thumb shimmer" />
              <span className="mono">{t("loading")}</span>
            </div>
          )}
          {failed && (
            <div className="row">
              <span className="mono">{t("errNetwork")}</span>
            </div>
          )}
          {(ticker ? [...rows!, ...rows!] : (rows ?? [])).map((r, i) => (
            <div className="row" key={`${r.id}-${i}`}>
              <span className="thumb" aria-hidden="true" />
              <span className="row-text">
                <span className="row-name">{r.label}</span>
                <span className="mono">
                  {r.photoCount} {t("photos")} · {dayLabel}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="feed-foot">
        <span className="foot-note">{t("feedFoot")}</span>
        <span className="mono">
          {total} {t("newPhotos")}
        </span>
      </div>

      <style jsx>{`
        .feed {
          display: flex;
          flex-direction: column;
          background: var(--panel);
          border-top: 1px solid var(--line);
        }
        .feed-head {
          padding: 20px 16px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid rgba(18, 17, 15, 0.14);
        }
        .feed-title {
          font-size: 24px;
          line-height: 1;
        }
        .live {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--red);
          animation: gdPulse 1.8s ease-in-out infinite;
        }
        .feed-body {
          position: relative;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .track {
          display: grid;
        }
        .row {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          min-height: 84px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(18, 17, 15, 0.1);
        }
        .thumb {
          flex: 0 0 auto;
          width: 68px;
          height: 52px;
          background-color: #ded8cb;
          background-image: repeating-linear-gradient(
            112deg,
            rgba(18, 17, 15, 0.08) 0 2px,
            rgba(18, 17, 15, 0) 2px 12px
          );
        }
        .row-skel .thumb {
          background-image: none;
        }
        .row-text {
          display: grid;
          gap: 5px;
          min-width: 0;
        }
        .row-name {
          font-size: 15.5px;
          font-weight: 500;
        }
        .feed-foot {
          padding: 14px 16px 20px;
          border-top: 1px solid rgba(18, 17, 15, 0.14);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .foot-note {
          max-width: 30ch;
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--muted);
        }

        @media (min-width: 900px) {
          .feed {
            border-top: 0;
            border-left: 1px solid var(--line);
          }
          .feed-head {
            padding: 26px 32px 18px;
          }
          .feed-title {
            font-size: 26px;
          }
          .feed-body {
            mask-image: linear-gradient(
              180deg,
              transparent 0,
              #000 46px,
              #000 calc(100% - 56px),
              transparent 100%
            );
            -webkit-mask-image: linear-gradient(
              180deg,
              transparent 0,
              #000 46px,
              #000 calc(100% - 56px),
              transparent 100%
            );
          }
          .track-run {
            animation: gdTicker 34s linear infinite;
          }
          .feed-body:hover .track-run {
            animation-play-state: paused;
          }
          .row {
            min-height: 92px;
            padding: 14px 32px;
            gap: 16px;
          }
          .thumb {
            width: 78px;
            height: 60px;
          }
          .feed-foot {
            padding: 16px 32px 24px;
          }
        }
      `}</style>
    </aside>
  );
}
