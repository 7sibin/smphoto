"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ulaz u kadar. Dizajn ovo radi jednim IntersectionObserver-om nad
 * [data-reveal]; ovdje je isto, samo po elementu, da svaka sekcija nosi
 * svoje stanje bez globalnog upita nad DOM-om.
 *
 * Ako observera nema, sadrzaj se odmah prikazuje — sekcija ne smije da
 * ostane nevidljiva zato sto animacija nije krenula.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        setOn(true);
        io.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-on={on ? "1" : undefined}
      style={on ? { animation: `gdReveal .9s cubic-bezier(.16,1,.3,1) ${delay}s both` } : undefined}
    >
      {children}

      <style jsx>{`
        /* Vezano za html.js (vidi layout.tsx). Stilovi ove komponente idu u
           SSR HTML, pa bi bez te ograde sadrzaj bio nevidljiv do hidracije —
           i trajno kod nekoga bez JS-a. Ako klase nema, nema ni skrivanja. */
        :global(html.js) div {
          opacity: 0;
        }
        :global(html.js) div[data-on] {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
