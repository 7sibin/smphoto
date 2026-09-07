"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { formatDate, weekday } from "@/lib/i18n";

type EventRow = {
  id: string;
  name: string;
  date: string;
  location: string;
  sessionCount: number;
};

type SessionRow = {
  id: string;
  label: string;
  photoCount: number;
  startsAt: string;
  unlocked: boolean;
};

/**
 * Pregled po datumu. Spisak je javan, sadrzaj nije — klik na termin vodi na
 * unos koda, a ne u galeriju. Zato ovdje nema nijednog photo id-a ni tokena.
 */
export function DatesScreen() {
  const { t, lang } = useLang();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Record<string, SessionRow[]>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("events");
        const data = (await res.json()) as { events: EventRow[] };
        if (!alive) return;
        setEvents(data.events);
        // Najnoviji dan je otvoren odmah — najcesci slucaj je "danas".
        if (data.events[0]) void toggle(data.events[0].id, true);
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(eventId: string, forceOpen = false) {
    const next = !forceOpen && openId === eventId ? null : eventId;
    setOpenId(next);
    if (!next || sessions[eventId]) return;

    try {
      const res = await fetch(`/api/events/${eventId}/sessions`);
      if (!res.ok) throw new Error("sessions");
      const data = (await res.json()) as { sessions: SessionRow[] };
      setSessions((prev) => ({ ...prev, [eventId]: data.sessions }));
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="screen">
      <div className="head">
        <div>
          <Link className="btn-link back" href="/kod">
            ← <span>{t("back")}</span>
          </Link>
          <h2 className="display">{t("datesTitle")}</h2>
        </div>
        <p className="lede">{t("datesBody")}</p>
      </div>

      <div className="list">
        {failed && !events && <p className="fail">{t("datesLoadFail")}</p>}
        {!events && !failed && <p className="mono">{t("loading")}</p>}

        {events?.map((ev) => {
          const open = openId === ev.id;
          const rows = sessions[ev.id];
          return (
            <div className="day" key={ev.id}>
              <button
                type="button"
                className="day-head"
                aria-expanded={open}
                onClick={() => void toggle(ev.id)}
              >
                <span className="day-left">
                  <span className="display day-date">{formatDate(ev.date)}</span>
                  <span className="mono">
                    {weekday(ev.date, lang)} · {ev.sessionCount} {t("runsWord")}
                  </span>
                </span>
                <span className="sign" aria-hidden="true">
                  {open ? "–" : "+"}
                </span>
              </button>

              {open && (
                <div className="runs">
                  {!rows && <span className="mono">{t("loading")}</span>}
                  {rows?.map((s) => (
                    <Link className="run" href="/kod" key={s.id}>
                      <span className="run-thumb" data-empty={s.photoCount ? undefined : "1"} />
                      <span className="run-text">
                        <span className="run-name">{s.label}</span>
                        <span className="mono">
                          {s.photoCount
                            ? `${s.photoCount} ${t("photos")}`
                            : t("datesEmpty")}
                        </span>
                      </span>
                      <span className="run-cta mono">
                        <span className="run-cta-label">{t("datesRunCta")}</span> →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .screen {
          flex: 1;
          animation: gdFade 0.3s ease both;
        }
        .head {
          padding: 20px var(--edge-narrow) 16px;
          border-bottom: 1px solid var(--line);
        }
        /* .back i .run sjede na <Link> — vidi komentar u SiteNav.tsx. */
        .head :global(.back) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        h2 {
          margin: 6px 0 0;
          font-size: clamp(34px, 10vw, 46px);
        }
        .lede {
          margin: 12px 0 0;
          max-width: 46ch;
          font-size: 15px;
          line-height: 1.6;
          color: var(--body);
        }
        /* Ista kolona kao .head — ranije je lista bila centrirana na
           1100px dok je naslov ostajao na rubu, pa se nisu poklapali. */
        .list {
          padding: 4px var(--edge-narrow) 60px;
        }
        .fail {
          padding: 30px 0;
          color: var(--red-deep);
        }
        .day {
          border-bottom: 1px solid var(--line);
        }
        .day-head {
          width: 100%;
          min-height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 2px;
          border: 0;
          background: transparent;
          text-align: left;
        }
        .day-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .day-date {
          font-size: 26px;
        }
        .sign {
          font-size: 22px;
          color: rgba(18, 17, 15, 0.5);
        }
        .runs {
          display: grid;
          gap: 10px;
          padding: 0 2px 18px;
        }
        .runs :global(.run) {
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 88px;
          padding: 12px 14px;
          border: 1px solid rgba(18, 17, 15, 0.18);
          border-radius: 14px;
          background: var(--field);
        }
        .runs :global(.run):hover {
          border-color: var(--ink);
        }
        .run-thumb {
          flex: 0 0 auto;
          width: 64px;
          height: 64px;
          background-color: #e0dbcf;
          background-image: repeating-linear-gradient(
            112deg,
            rgba(18, 17, 15, 0.08) 0 2px,
            rgba(18, 17, 15, 0) 2px 12px
          );
        }
        .run-thumb[data-empty] {
          background-color: #ddd9d0;
          background-image: none;
        }
        .run-text {
          display: grid;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        .run-name {
          font-size: 15.5px;
          font-weight: 500;
          white-space: nowrap;
        }
        .run-cta {
          flex: 0 0 auto;
          color: var(--red);
        }
        /* Ispod 700px puna labela lomi ime termina u dva reda. Da je kod
           potreban vec pise u uvodnom pasusu iznad, pa ostaje strelica. */
        .run-cta-label {
          display: none;
        }

        @media (min-width: 700px) {
          .head {
            padding-block: 30px 18px;
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 28px;
            flex-wrap: wrap;
          }
          .lede {
            margin: 0 0 6px;
          }
          .list {
            padding-block: 10px 60px;
          }
          .day-head {
            padding: 18px 4px;
          }
          .day-left {
            flex-direction: row;
            align-items: baseline;
            gap: 18px;
          }
          .day-date {
            font-size: 30px;
          }
          .run-cta-label {
            display: inline;
          }
          .runs {
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 12px;
            padding: 0 4px 18px;
          }
        }
      `}</style>
    </div>
  );
}
