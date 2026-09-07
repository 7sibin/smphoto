"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { BlockedScreen } from "@/components/BlockedScreen";
import { PhotoGrid } from "@/components/PhotoGrid";
import { Lightbox } from "@/components/Lightbox";
import { UnlockPanel } from "@/components/UnlockPanel";
import { ZipModal } from "@/components/ZipModal";
import { useLang } from "@/components/LangContext";
import { formatDate, formatPrice } from "@/lib/i18n";
import {
  fetchPhotos,
  fetchStatus,
  GoneError,
  loadGrant,
  saveGrant,
  type Grant,
  type PhotoRef,
} from "@/lib/client";

/** Koliko slika prije kraja ucitanog pocinje povlacenje sledece strane. */
const PREFETCH_MARGIN = 12;
/** Zakljucana galerija ceka naplatu. */
const POLL_IDLE_MS = 8000;
/** Panel za placanje je otvoren — grupa gleda u ekran i ceka. */
const POLL_ACTIVE_MS = 3000;
/** Otkljucana galerija vise ne ceka nista, ali token ima rok. */
const POLL_UNLOCKED_MS = 60000;

export function Gallery({ sessionId }: { sessionId: string }) {
  const { t } = useLang();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [grant, setGrant] = useState<Grant | null>(null);
  const [checked, setChecked] = useState(false);
  const [photos, setPhotos] = useState<(PhotoRef | null)[]>([]);
  const [needIndex, setNeedIndex] = useState(0);
  const [netDown, setNetDown] = useState(false);
  const [gone, setGone] = useState<"expired" | "archived" | null>(null);
  const [lb, setLb] = useState<number | null>(null);
  const [panel, setPanel] = useState<"buy" | null>(null);
  const [zip, setZip] = useState<"web" | "full" | null>(null);
  const [toast, setToast] = useState(false);

  const loaded = useRef(0);
  const cursor = useRef<string | null>(null);
  const done = useRef(false);
  const busy = useRef(false);

  // Bez granta nema sta da se pokaze — kod je jedina autentikacija.
  useEffect(() => {
    const g = loadGrant(sessionId);
    if (!g) {
      router.replace("/kod");
      return;
    }
    setGrant(g);
    // Duzina se zna odmah, pa grid ima konacnu visinu prije prve slike.
    setPhotos(new Array<PhotoRef | null>(g.session.photoCount).fill(null));
    setChecked(true);
  }, [sessionId, router]);

  const loadMore = useCallback(async (g: Grant) => {
    if (busy.current || done.current) return;
    busy.current = true;
    try {
      const page = await fetchPhotos(g.sessionId, g.token, cursor.current);
      const start = loaded.current;
      setPhotos((prev) => {
        const next = prev.slice();
        page.photos.forEach((p, i) => {
          next[start + i] = p;
        });
        return next;
      });
      loaded.current = start + page.photos.length;
      cursor.current = page.nextCursor;
      if (!page.nextCursor) done.current = true;
      setNetDown(false);
    } catch (e) {
      if (e instanceof GoneError) setGone(e.reason);
      else setNetDown(true);
    } finally {
      busy.current = false;
    }
  }, []);

  // Lanac se sam nastavlja: svaka ucitana strana ponovo pokrece ovaj efekat,
  // pa skok na dno galerije od 420 slika povlaci strane dok ne stigne dotle.
  useEffect(() => {
    if (!grant || netDown || gone || done.current) return;
    if (needIndex >= loaded.current - PREFETCH_MARGIN) void loadMore(grant);
  }, [grant, needIndex, netDown, gone, photos, loadMore]);

  // Polling — galerija se otkljuca sama dok je grupa gleda.
  //
  // Ne gasi se poslije otkljucavanja, samo uspori: token ima rok od 30 minuta,
  // a /status ga obnovi kad se priblizi kraju. Bez ovoga bi galerija otvorena
  // duze od tog roka pocela da vraca 401 na svaku sliku.
  useEffect(() => {
    if (!grant || gone) return;
    let alive = true;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const out = await fetchStatus(grant.sessionId, grant.token);
      if (!alive) return;

      if (out.kind === "gone") {
        setGone(out.reason);
        return;
      }
      if (out.kind === "offline") {
        setNetDown(true);
        return;
      }
      setNetDown(false);

      // Nivo se ne "nadogradjuje" — server izda drugi token, sa clean putanjom.
      if (out.token && out.mediaBase) {
        const next: Grant = {
          ...grant,
          token: out.token,
          mediaBase: out.mediaBase,
          unlocked: out.unlocked,
          session: { ...grant.session, unlocked: out.unlocked },
        };
        saveGrant(next);
        setGrant(next);
        // Toast samo na prelazu, ne na svakom osvjezavanju tokena.
        if (out.unlocked && !grant.unlocked) {
          setPanel(null);
          setToast(true);
        }
      }
    };

    const ms = grant.unlocked ? POLL_UNLOCKED_MS : panel ? POLL_ACTIVE_MS : POLL_IDLE_MS;
    const id = setInterval(() => void tick(), ms);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [grant, gone, panel]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  // Prekid mreze zna i browser, ne samo neuspio fetch.
  useEffect(() => {
    const off = () => setNetDown(true);
    const on = () => setNetDown(false);
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);

  const onUnlockedByCode = useCallback((g: Grant) => {
    saveGrant(g);
    setGrant(g);
    setPanel(null);
    setToast(true);
  }, []);

  const retry = useCallback(() => {
    setNetDown(false);
    setNeedIndex((n) => n);
    if (grant) void loadMore(grant);
  }, [grant, loadMore]);

  if (gone) {
    return (
      <main className="page">
        <SiteNav help tagline="appName" />
        <BlockedScreen reason={gone} />
      </main>
    );
  }

  if (!checked || !grant) {
    return (
      <main className="page">
        <SiteNav help tagline="appName" />
        <div className="center mono">{t("loading")}</div>
        <style jsx>{`
          .page {
            min-height: 100svh;
            display: flex;
            flex-direction: column;
          }
          .center {
            flex: 1;
            display: grid;
            place-items: center;
          }
        `}</style>
      </main>
    );
  }

  const s = grant.session;
  const locked = !grant.unlocked;
  const empty = s.photoCount === 0;

  return (
    <main className="page">
      <SiteNav help tagline="appName" />

      <div className="gal-head">
        <div className="gal-id">
          <Link className="btn-link back" href="/dani">
            ← <span>{t("allRuns")}</span>
          </Link>
          <span className="display gal-name">{s.label}</span>
          <span className="mono">
            {formatDate(s.event.date)} · {s.photoCount} {t("photos")}
          </span>
        </div>
        {locked && !empty && (
          <div className="lock-note">
            <span className="dot" aria-hidden="true" />
            <span>{t("lockedNote")}</span>
          </div>
        )}
      </div>

      {netDown && (
        <div className="net" role="alert">
          <span>{t("netTitle")}</span>
          <button type="button" className="btn net-retry" onClick={retry}>
            {t("retry")}
          </button>
        </div>
      )}

      <div className="scroll" ref={scrollRef}>
        {empty ? (
          <div className="empty">
            <span className="display empty-title">{t("emptyTitle")}</span>
            <span className="empty-body">{t("emptyBody")}</span>
          </div>
        ) : (
          <div className="grid-wrap">
            <PhotoGrid
              grant={grant}
              photos={photos}
              netDown={netDown}
              onOpen={setLb}
              onWindow={setNeedIndex}
              scrollRef={scrollRef}
            />
          </div>
        )}
      </div>

      {!empty && locked && (
        <div className="bar bar-locked">
          <div className="bar-left">
            <span className="display price">{formatPrice(s.price, s.currency)}</span>
            <span className="mono">
              {t("wholeGallery")} · {s.photoCount} {t("photos")}
            </span>
          </div>
          <button type="button" className="btn btn-primary bar-cta" onClick={() => setPanel("buy")}>
            {t("unlockCta")}
          </button>
        </div>
      )}

      {!empty && !locked && (
        <div className="bar bar-unlocked">
          <div className="bar-left">
            <span className="display dl-title">{t("downloadTitle")}</span>
            <span className="mono dl-tag">
              {s.photoCount} {t("photos")} · {t("unlockedTag")}
            </span>
          </div>
          <div className="dl-opts">
            <button type="button" className="dl" onClick={() => setZip("web")}>
              <span className="dl-name">{t("zipWeb")}</span>
              <span className="mono dl-meta">{t("zipWebMeta")}</span>
            </button>
            <button type="button" className="dl" onClick={() => setZip("full")}>
              <span className="dl-name">{t("zipFull")}</span>
              <span className="mono dl-meta">{t("zipFullMeta")}</span>
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{t("unlockedToast")}</div>}

      {lb !== null && (
        <Lightbox
          grant={grant}
          photos={photos}
          index={lb}
          locked={locked}
          onIndex={(next) => {
            setLb(next);
            setNeedIndex((n) => Math.max(n, next + PREFETCH_MARGIN));
          }}
          onClose={() => setLb(null)}
          onUnlock={() => {
            setLb(null);
            setPanel("buy");
          }}
        />
      )}

      {panel === "buy" && (
        <UnlockPanel
          session={s}
          code={grant.code}
          onClose={() => setPanel(null)}
          onUnlocked={onUnlockedByCode}
        />
      )}

      {zip && <ZipModal kind={zip} photoCount={s.photoCount} onClose={() => setZip(null)} />}

      <style jsx>{`
        .page {
          height: 100svh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .gal-head {
          flex: 0 0 auto;
          padding: 14px var(--edge) 12px;
          background: var(--bg);
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .gal-id {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        /* .back sjedi na <Link> — vidi komentar u SiteNav.tsx. */
        .gal-id :global(.back) {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .gal-name {
          font-size: 28px;
          line-height: 0.95;
        }
        .lock-note {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 12.5px;
          color: var(--red-deep);
        }
        .dot {
          display: block;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--red);
        }
        .net {
          flex: 0 0 auto;
          margin: 10px var(--edge) 0;
          padding: 14px 16px;
          border-radius: 14px;
          background: var(--ink);
          color: var(--bg);
          font-size: 14px;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: gdUp 0.3s ease both;
        }
        .net-retry {
          align-self: flex-start;
          min-height: 44px;
          border-color: rgba(245, 243, 238, 0.4);
          color: var(--bg);
        }
        /* Inset stoji na skroleru, ne na .grid-wrap: procenat se tako
           racuna prema .page, istoj sirini koju gleda i --edge u glavi i
           traci, pa lijeva ivica grida stoji tacno ispod naslova. Ispod
           --content je nula i grid ide od ruba do ruba, kao u dizajnu. */
        .scroll {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding-inline: max(0px, (100% - var(--content)) / 2);
        }
        .grid-wrap {
          padding: 0 0 8px;
        }
        .empty {
          padding: 70px 20px;
          text-align: center;
        }
        .empty-title {
          display: block;
          font-size: 32px;
        }
        .empty-body {
          display: block;
          margin: 12px auto 0;
          max-width: 46ch;
          font-size: 15px;
          line-height: 1.6;
          color: var(--body);
        }
        .bar {
          flex: 0 0 auto;
          padding: 12px var(--edge) calc(12px + env(safe-area-inset-bottom));
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bar-locked {
          background: var(--bg);
          border-top: 1px solid rgba(18, 17, 15, 0.2);
        }
        .bar-unlocked {
          background: var(--ink);
          color: var(--bg);
        }
        .bar-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
          flex-wrap: wrap;
        }
        .price {
          font-size: 30px;
          line-height: 1;
        }
        .bar-cta {
          min-height: 56px;
        }
        .dl-title {
          font-size: 24px;
        }
        .dl-tag {
          color: rgba(245, 243, 238, 0.6);
        }
        .dl-opts {
          display: grid;
          gap: 10px;
        }
        .dl {
          display: grid;
          gap: 3px;
          min-height: 58px;
          padding: 10px 18px;
          border: 1px solid rgba(245, 243, 238, 0.35);
          border-radius: 14px;
          background: transparent;
          color: var(--bg);
          text-align: left;
        }
        .dl:hover {
          background: rgba(245, 243, 238, 0.1);
        }
        .dl-name {
          font-size: 14px;
          font-weight: 500;
        }
        .dl-meta {
          color: rgba(245, 243, 238, 0.6);
        }
        .toast {
          position: fixed;
          /* Bez transforma za centriranje — gdUp bi ga pregazio. */
          left: 0;
          right: 0;
          margin: 0 auto;
          width: fit-content;
          bottom: calc(96px + env(safe-area-inset-bottom));
          z-index: 90;
          padding: 14px 22px;
          border-radius: 999px;
          background: var(--ink);
          color: var(--bg);
          font-size: 14px;
          animation: gdUp 0.3s ease both;
        }

        @media (min-width: 700px) {
          .gal-head {
            padding-block: 20px 16px;
            gap: 28px;
          }
          .gal-name {
            font-size: 40px;
          }
          .net {
            margin-top: 12px;
            max-width: 460px;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
          .net-retry {
            align-self: auto;
          }
          .bar {
            padding-block: 16px calc(16px + env(safe-area-inset-bottom));
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            flex-wrap: wrap;
          }
          .bar-left {
            gap: 16px;
          }
          .price {
            font-size: 34px;
          }
          .bar-cta {
            padding: 0 36px;
          }
          .dl-title {
            font-size: 26px;
          }
          .dl-opts {
            grid-auto-flow: column;
            gap: 12px;
          }
          .dl {
            padding: 10px 22px;
          }
          .toast {
            bottom: 110px;
          }
        }

        /* Telefon u landscape-u: visina je 375px, a glava + traka su racunate
           za portret. Sve se stisne, traka ide u red i ispod 700px sirine. */
        @media (orientation: landscape) and (max-height: 520px) {
          .gal-head {
            padding-block: 8px 8px;
          }
          .gal-name {
            font-size: 22px;
          }
          .bar {
            padding-block: 8px calc(8px + env(safe-area-inset-bottom));
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
          }
          .price {
            font-size: 24px;
          }
          .bar-cta {
            min-height: var(--tap);
          }
          .dl-title {
            font-size: 20px;
          }
          .dl-opts {
            grid-auto-flow: column;
            gap: 10px;
          }
          .dl {
            min-height: var(--tap);
            padding: 6px 16px;
          }
          .toast {
            bottom: calc(76px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </main>
  );
}
