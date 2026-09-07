"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LangContext";
import { STRINGS, type StringKey } from "@/lib/i18n";

/**
 * Meni javnog sajta. Dizajn ima dvije glave i to nije slucajno:
 *
 *  - "overlay" stoji fiksiran preko hero fotografije, na tamnom. Logo je
 *    krug sa SM, jer logo.jpg ide kroz mix-blend-mode: multiply i na crnoj
 *    podlozi bi nestao.
 *  - "solid" je svijetla traka sa linijom ispod, na kategorijama i O nama.
 *
 * Ispod 900px se linkovi sklanjaju u fioku preko cijelog ekrana — pet stavki
 * sa razmaknutim verzalom ne staje u jedan red na 375px.
 *
 * "help" pali broj telefona u traci — na ekranima toka sa kodom (/kod, /dani,
 * galerija, admin) grupa stoji na parkingu i poziv je brzi od svega ostalog.
 * "tagline" mijenja potpis pored loga: na tim ekranima to je svrha ekrana
 * ("Preuzmi svoje fotografije"), na javnom sajtu identitet studija.
 * "narrow" veze traku za uzu kolonu (--content-narrow), da logo stoji tacno
 * iznad sadrzaja na ekranima koji nisu grid — /dani, /admin, /o-nama.
 */

type Variant = "overlay" | "solid";

type Item = { href: string; key: StringKey };

const ITEMS: Item[] = [
  { href: "/", key: "navHome" },
  { href: "/galerija/rafting", key: "navRafting" },
  { href: "/galerija/vencanja", key: "navWeddings" },
  { href: "/galerija/krstenja", key: "navBaptisms" },
  { href: "/galerija/rodjendani", key: "navBirthdays" },
  { href: "/o-nama", key: "navAbout" },
];

export function SiteNav({
  variant = "solid",
  help = false,
  narrow = false,
  tagline = "navTagline",
}: {
  variant?: Variant;
  help?: boolean;
  narrow?: boolean;
  tagline?: StringKey;
}) {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fioka je preko cijelog ekrana; bez ovoga stranica ispod nastavi da klizi.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Promjena rute zatvara fioku.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isOn = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`nav nav-${variant}`}
      data-open={open ? "1" : undefined}
      data-narrow={narrow ? "1" : undefined}
    >
      <Link href="/" className="brand" aria-label="SM Foto Studio">
        {variant === "overlay" ? (
          <span className="mark" aria-hidden="true">
            SM
          </span>
        ) : (
          <>
            {/* Logo je snimljen na bijeloj podlozi; multiply ga stapa sa #f5f3ee. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="" width={52} height={52} />
            <span className="brand-rule" aria-hidden="true" />
            <span className="brand-name">{t(tagline)}</span>
          </>
        )}
      </Link>

      <nav className="links" aria-label={t("navMenu")}>
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={isOn(it.href) ? "link link-on" : "link"}
            aria-current={isOn(it.href) ? "page" : undefined}
          >
            {t(it.key)}
          </Link>
        ))}
      </nav>

      <div className="right">
        {help ? (
          <a className="help" href={`tel:${STRINGS.phone[0]}`}>
            {t("helpLine")}
          </a>
        ) : null}
        <div className="lang" role="group" aria-label="Jezik / Language">
          {(["bs", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              data-on={lang === l ? "1" : undefined}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="burger"
          aria-expanded={open}
          aria-controls="site-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t("navClose") : t("navMenu")}
        </button>
      </div>

      <div id="site-drawer" className="drawer" hidden={!open}>
        {help ? (
          <a className="drawer-help" href={`tel:${STRINGS.phone[0]}`}>
            {t("helpLine")}
          </a>
        ) : null}
        <nav aria-label={t("navMenu")}>
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={isOn(it.href) ? "dlink dlink-on" : "dlink"}
              aria-current={isOn(it.href) ? "page" : undefined}
            >
              {t(it.key)}
            </Link>
          ))}
        </nav>
      </div>

      <style jsx>{`
        .nav {
          position: relative;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px var(--edge);
        }
        .nav[data-narrow] {
          padding-inline: var(--edge-narrow);
        }
        .nav-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          border-bottom: 1px solid rgba(245, 243, 238, 0.14);
          color: #f5f3ee;
          animation: gdFade 0.9s ease 0.08s both;
        }
        /* Zamucenje ide na sloj ispod trake, ne na traku. backdrop-filter
           pravi containing block za position: fixed potomke, a fioka je
           potomak trake: sa zamucenjem na traci fioka mjeri svojih
           inset: 0; top: 66px prema traci od 70px umjesto prema ekranu, pa
           joj visina ispadne 48px i od sest stavki se vidi pola prve.
           Traka bez filtera vise nije sidro; izgled je isti jer sloj pokriva
           tacno isto polje koje je pokrivala pozadina. */
        .nav-overlay::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background: rgba(18, 17, 15, 0.82);
          backdrop-filter: blur(10px);
        }
        .nav-solid {
          background: var(--bg);
          border-bottom: 1px solid var(--ink);
          animation: gdFade 0.8s ease 0.05s both;
        }

        /* .brand i .link sjede na <Link>, a styled-jsx dodaje scope klasu
           samo DOM elementima — ne komponentama. Zato idu preko :global(),
           ali ukotvljeni za .nav da ne cure izvan trake. */
        .nav :global(.brand) {
          display: flex;
          align-items: center;
          /* Logo je link na naslovnu, dakle tap target, ne ukras. */
          min-height: var(--tap);
          gap: 10px;
          min-width: 0;
          flex: 0 1 auto;
        }
        .nav :global(.brand) img {
          display: block;
          width: 38px;
          height: 38px;
          object-fit: contain;
          mix-blend-mode: multiply;
        }
        .mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border: 1px solid rgba(245, 243, 238, 0.75);
          border-radius: 50%;
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.16em;
          text-indent: 0.16em;
          text-transform: uppercase;
          color: #f5f3ee;
        }
        .nav :global(.brand):hover .mark {
          border-color: var(--red);
        }
        .brand-rule {
          display: none;
          width: 1px;
          height: 26px;
          background: rgba(18, 17, 15, 0.2);
        }
        .brand-name {
          display: none;
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .links {
          display: none;
          align-items: center;
          gap: 22px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .nav :global(.link) {
          padding-bottom: 3px;
          border-bottom: 1px solid transparent;
          white-space: nowrap;
        }
        .nav-overlay :global(.link) {
          color: rgba(245, 243, 238, 0.86);
        }
        .nav-overlay :global(.link):hover,
        .nav-overlay :global(.link-on) {
          color: #f5f3ee;
        }
        .nav-overlay :global(.link-on) {
          border-bottom-color: var(--red);
        }
        .nav-solid :global(.link):hover {
          color: var(--muted);
        }
        .nav-solid :global(.link-on) {
          color: var(--red);
          border-bottom-color: var(--red);
        }

        .right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 0 0 auto;
        }
        .help {
          display: none;
          align-items: center;
          min-height: var(--tap);
          font-size: 12.5px;
          color: var(--muted);
          white-space: nowrap;
        }
        .nav-overlay .help {
          color: rgba(245, 243, 238, 0.75);
        }
        .lang {
          display: flex;
          border: 1px solid rgba(18, 17, 15, 0.28);
          border-radius: 999px;
          overflow: hidden;
        }
        .nav-overlay .lang {
          border-color: rgba(245, 243, 238, 0.4);
        }
        .lang :global(button) {
          min-width: 46px;
          min-height: var(--tap);
          padding: 0 10px;
          border: 0;
          background: transparent;
          color: var(--ink);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.14em;
        }
        .nav-overlay .lang :global(button) {
          color: #f5f3ee;
        }
        .lang :global(button[data-on]) {
          background: var(--ink);
          color: var(--bg);
        }
        .nav-overlay .lang :global(button[data-on]) {
          background: #f5f3ee;
          color: var(--ink);
        }

        .burger {
          min-height: var(--tap);
          padding: 0 16px;
          border: 1px solid var(--line-strong);
          border-radius: 999px;
          background: transparent;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .nav-overlay .burger {
          border-color: rgba(245, 243, 238, 0.4);
          color: #f5f3ee;
        }

        .drawer {
          position: fixed;
          inset: 0;
          top: 66px;
          z-index: 39;
          padding: 8px var(--edge) 40px;
          background: var(--bg);
          overflow-y: auto;
          animation: gdFade 0.2s ease both;
        }
        .nav[data-narrow] .drawer {
          padding-inline: var(--edge-narrow);
        }
        .nav-overlay .drawer {
          background: #12110f;
        }
        .drawer nav {
          display: grid;
        }
        .drawer :global(.dlink) {
          display: flex;
          align-items: center;
          min-height: 62px;
          border-bottom: 1px solid var(--line);
          font-family: var(--font-shoulders), Impact, sans-serif;
          font-weight: 800;
          font-size: 30px;
          text-transform: uppercase;
          letter-spacing: -0.01em;
        }
        .nav-overlay .drawer :global(.dlink) {
          border-bottom-color: rgba(245, 243, 238, 0.18);
          color: #f5f3ee;
        }
        .drawer :global(.dlink-on) {
          color: var(--red);
        }
        .drawer-help {
          display: flex;
          align-items: center;
          min-height: 56px;
          border-bottom: 1px solid var(--line);
          font-size: 15px;
          color: var(--red-deep);
        }
        .nav-overlay .drawer-help {
          border-bottom-color: rgba(245, 243, 238, 0.18);
          color: #f3a3a6;
        }

        @media (min-width: 700px) {
          .help {
            display: flex;
          }
        }

        @media (min-width: 900px) {
          .nav {
            gap: 28px;
            padding-block: 14px;
          }
          .nav :global(.brand) img {
            width: 48px;
            height: 48px;
          }
          .brand-rule,
          .brand-name {
            display: block;
          }
          .links {
            display: flex;
          }
          .burger,
          .drawer {
            display: none;
          }
          .right {
            gap: 18px;
          }
        }

        /* Telefon u landscape-u: traka gubi vertikalni razmak, dugmad ostaju. */
        @media (orientation: landscape) and (max-height: 520px) {
          .nav {
            padding-block: 4px;
          }
          .drawer {
            top: 58px;
          }
          .drawer :global(.dlink) {
            min-height: var(--tap);
            font-size: 22px;
          }
        }
      `}</style>
    </header>
  );
}
