"use client";

import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { STRINGS } from "@/lib/i18n";

/** Ekran za 410: kod je istekao ili je galerija sklonjena. */
export function BlockedScreen({ reason }: { reason: "expired" | "archived" }) {
  const { t } = useLang();
  const expired = reason === "expired";

  return (
    <div className="wrap">
      <div className="inner">
        <span className="kicker" style={{ color: "var(--red)" }}>
          {t(expired ? "expiredKicker" : "archivedKicker")}
        </span>
        <h2 className="display">{t(expired ? "expiredTitle" : "archivedTitle")}</h2>
        <p>{t(expired ? "expiredBody" : "archivedBody")}</p>
        <div className="row">
          <a className="btn btn-primary" href={`tel:${STRINGS.phone[0]}`}>
            {t("callUs")}
          </a>
          <Link className="btn btn-ghost" href="/kod">
            {t("back")}
          </Link>
        </div>
      </div>

      <style jsx>{`
        .wrap {
          flex: 1;
          display: flex;
          align-items: flex-start;
          padding: 48px var(--gutter) 64px;
          animation: gdFade 0.3s ease both;
        }
        .inner {
          max-width: 620px;
        }
        h2 {
          margin: 14px 0 0;
          font-size: clamp(38px, 11vw, 58px);
          line-height: 0.9;
        }
        p {
          margin: 18px 0 0;
          font-size: 16px;
          line-height: 1.6;
          color: var(--body);
          text-wrap: pretty;
        }
        .row {
          margin-top: 30px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .row :global(.btn) {
          min-height: 56px;
        }
        @media (min-width: 700px) {
          .wrap {
            padding-block: 90px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
