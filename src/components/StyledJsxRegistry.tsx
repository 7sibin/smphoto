"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { StyleRegistry, createStyleRegistry } from "styled-jsx";

/**
 * Bez ovoga styled-jsx u App Routeru ne stigne do SSR HTML-a: elementi dobiju
 * jsx-<hash> klasu, a pravila za tu klasu se ubace tek kad se JS bundle skine
 * i hidrira. Devetnaest komponenti nosi svoj CSS u <style jsx>, sto je samo na
 * naslovnoj ~35 kB rasporeda koji fali u prvom paintu — odatle sadrzaj bez
 * CSS-a na ulazu, i u dev i u produkciji.
 *
 * useServerInsertedHTML to skupi na serveru i uglavi u HTML prije nego stigne
 * do klijenta. flush() je obavezan: bez njega bi se isti stilovi ponovili u
 * svakom komadu streama.
 */
export function StyledJsxRegistry({ children }: { children: React.ReactNode }) {
  const [registry] = useState(() => createStyleRegistry());

  useServerInsertedHTML(() => {
    const styles = registry.styles();
    registry.flush();
    return <>{styles}</>;
  });

  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}
