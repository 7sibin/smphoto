"use client";

import { useEffect, type RefObject } from "react";

type Args = {
  /** Blok koji se pinuje — nosi zicu, traku i brojac. */
  wrap: RefObject<HTMLDivElement | null>;
  /** Traka sa kadrovima; ovo je ono sto se vuce po x. */
  track: RefObject<HTMLDivElement | null>;
  /** Zove se na svaki frame skrola, 0..1. Ne kroz state — pise pravo u DOM. */
  onProgress: (p: number) => void;
};

/**
 * Vertikalni skrol vuce traku vodoravno.
 *
 * Osnovno stanje trake je prevlacenje prstom, i to je cist CSS
 * (overflow-x: auto + scroll-snap). Ovaj hook to preuzima tek kad se GSAP
 * ucita. Ako ne stigne, ako je JS pao ili ako korisnik trazi manje pokreta —
 * traka ostaje ono sto je bila i radi. Nema stanja u kojem sekcija ne radi.
 *
 * Duzina pina se racuna iz stvarne sirine trake, ne fiksno: put je tacno
 * onoliko koliko treba da posljednji kadar dodje do desne ivice.
 */
export function useHangRail({ wrap, track, onProgress }: Args) {
  useEffect(() => {
    const wrapEl = wrap.current;
    const trackEl = track.current;
    if (!wrapEl || !trackEl) return;

    let stop: (() => void) | undefined;
    let dropped = false;

    void (async () => {
      let gsap: typeof import("gsap").gsap;
      let ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
      try {
        const [core, plugin] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        gsap = core.gsap;
        ScrollTrigger = plugin.ScrollTrigger;
      } catch {
        return;
      }
      if (dropped) return;

      gsap.registerPlugin(ScrollTrigger);
      // Adresna traka na iOS-u se skuplja tokom skrola i mijenja visinu
      // viewporta. Bez ovoga pin poskoci na svaku takvu promjenu.
      ScrollTrigger.config({ ignoreMobileResize: true });

      const mm = gsap.matchMedia();

      // Od 1000px sve cetiri stoje u redu — nema sta da se vuce.
      mm.add("(max-width: 999px) and (prefers-reduced-motion: no-preference)", () => {
        // Koliko sadrzaja mora da prodje ispod prozora. Mjeri se iz layouta
        // kadrova, ne iz scrollWidth-a: pod data-rail isjecak drzi wrap, pa
        // traka vise nije skrol kontejner i scrollWidth ne bi prijavio
        // prekoracenje — a invalidateOnRefresh ovo racuna ponovo na svaki
        // refresh, i prva nula bi zamrznula traku. offsetLeft/offsetWidth su
        // layout vrijednosti; nagib kadrova i pomak trake ih ne diraju.
        const span = () => {
          const first = trackEl.firstElementChild as HTMLElement | null;
          const last = trackEl.lastElementChild as HTMLElement | null;
          if (!first || !last) return 0;
          const cs = getComputedStyle(trackEl);
          const content =
            last.offsetLeft +
            last.offsetWidth -
            first.offsetLeft +
            parseFloat(cs.paddingLeft) +
            parseFloat(cs.paddingRight);
          return Math.max(0, Math.round(content - trackEl.clientWidth));
        };
        if (span() <= 0) return;

        // Ako je korisnik prevukao prstom prije nego se GSAP ucitao, scrollLeft
        // bi se sabrao sa transformom. Na nulu, pa rucno prevlacenje gasi CSS
        // koji visi na data-rail.
        trackEl.scrollLeft = 0;
        wrapEl.dataset.rail = "on";
        onProgress(0);

        const tw = gsap.to(trackEl, {
          x: () => -span(),
          ease: "none",
          scrollTrigger: {
            trigger: wrapEl,
            start: "center center",
            end: () => "+=" + span(),
            pin: true,
            scrub: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => onProgress(self.progress),
          },
        });

        return () => {
          delete wrapEl.dataset.rail;
          tw.scrollTrigger?.kill();
          tw.kill();
          gsap.set(trackEl, { clearProps: "x" });
        };
      });

      stop = () => mm.revert();
    })();

    return () => {
      dropped = true;
      stop?.();
    };
  }, [wrap, track, onProgress]);
}
