/**
 * Mock derivati. Ovaj pass nema pravi storage ni CDN — bajtove pravi server.
 *
 * Vazno je da se vodeni zig pece U BAJTOVE, ne da se lepi CSS-om preko cistе
 * slike. CSS overlay bi znacio da cista slika vec putuje do klijenta, pa da je
 * dovoljno ugasiti jedan div. Kad ovo zameni pravi CDN, ugovor ostaje isti:
 * dve zone, dva razlicita fajla, nijedan zajednicki code path.
 */

export type Variant = "wm" | "clean";

export const ALLOWED_WIDTHS = [400, 800, 1400, 2048] as const;
export const DEFAULT_WIDTH = 800;

export function clampWidth(raw: string | null): number {
  const n = Number(raw);
  const match = ALLOWED_WIDTHS.find((w) => w === n);
  return match ?? DEFAULT_WIDTH;
}

function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Tonovi izvedeni iz palete dizajna, pomereni po hue-u da grid ne bude ravan. */
function scene(seed: number) {
  const hue = 150 + (seed % 90);           // zeleno-plavi opseg rijeke
  const warm = 28 + ((seed >> 7) % 18);    // topli pijesak/stijena
  return {
    sky: `hsl(${hue - 40} 26% ${72 + (seed % 8)}%)`,
    far: `hsl(${hue - 12} 22% ${54 + ((seed >> 3) % 10)}%)`,
    water: `hsl(${hue} 30% ${38 + ((seed >> 5) % 12)}%)`,
    foam: `hsl(${hue + 10} 24% ${82 + ((seed >> 9) % 6)}%)`,
    rock: `hsl(${warm} 24% ${34 + ((seed >> 11) % 10)}%)`,
    raft: `hsl(${4 + ((seed >> 13) % 14)} 62% ${46 + ((seed >> 15) % 10)}%)`,
  };
}

type BuildArgs = {
  photoId: string;
  variant: Variant;
  width: number;
  height: number;
  label: string;
};

/** Sintetican "kadar sa spusta" — deterministican po photoId. */
function buildSyntheticSvg({ photoId, variant, width, height, label }: BuildArgs): string {
  const seed = hash32(photoId);
  const c = scene(seed);

  const horizon = Math.round(height * (0.34 + ((seed >> 2) % 12) / 100));
  const raftX = Math.round(width * (0.2 + ((seed >> 6) % 50) / 100));
  const raftY = horizon + Math.round((height - horizon) * (0.2 + ((seed >> 8) % 40) / 100));
  const raftW = Math.round(width * 0.2);
  const raftH = Math.round(raftW * 0.32);

  const foam = Array.from({ length: 7 }, (_, i) => {
    const s = hash32(`${photoId}:foam:${i}`);
    const cx = (s % width);
    const cy = horizon + ((s >> 8) % Math.max(1, height - horizon));
    const rx = 14 + ((s >> 4) % Math.round(width * 0.09));
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${Math.round(rx * 0.28)}" fill="${c.foam}" opacity="0.35"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.sky}"/><stop offset="1" stop-color="${c.far}"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.far}"/><stop offset="1" stop-color="${c.water}"/>
    </linearGradient>
    <pattern id="grain" width="12" height="12" patternTransform="rotate(112)" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="none"/>
      <rect width="2" height="12" fill="rgba(18,17,15,0.075)"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${horizon}" fill="url(#sky)"/>
  <rect y="${horizon}" width="${width}" height="${height - horizon}" fill="url(#water)"/>
  <path d="M0 ${horizon} L${Math.round(width * 0.3)} ${horizon - Math.round(height * 0.16)} L${Math.round(width * 0.52)} ${horizon} Z" fill="${c.rock}" opacity="0.85"/>
  <path d="M${Math.round(width * 0.44)} ${horizon} L${Math.round(width * 0.72)} ${horizon - Math.round(height * 0.22)} L${width} ${horizon} Z" fill="${c.rock}" opacity="0.7"/>
  ${foam}
  <rect x="${raftX}" y="${raftY}" width="${raftW}" height="${raftH}" rx="${Math.round(raftH / 2)}" fill="${c.raft}"/>
  <rect width="${width}" height="${height}" fill="url(#grain)"/>
  ${variant === "wm" ? watermarkLayer(width, height) : ""}
  <text x="${Math.round(width * 0.025)}" y="${height - Math.round(height * 0.03)}" font-family="ui-monospace, monospace" font-size="${Math.max(9, Math.round(width * 0.022))}" letter-spacing="1.4" fill="rgba(245,243,238,0.72)">${esc(label)}</text>
</svg>`;
}

/**
 * Ukoso poplocan zig, isti ugao i tezina kao u dizajnu.
 *
 * Tamno slovo sa svijetlim obrubom, ne samo tamno slovo: preko pjene i neba
 * radi i sam fill, ali preko stijene i tamnog camca nestane. Prava fotografija
 * ima i jedno i drugo u istom kadru, pa zig mora da se drzi na oba.
 *
 * Exportovan da bi ga skripta za pecenje derivata (scripts/bake.ts) koristila
 * doslovno isti — zig na mock slici i zig na pravoj fotografiji ne smiju da se
 * razilaze zato sto su prepisani na dva mjesta.
 */
export function watermarkLayer(width: number, height: number): string {
  const size = Math.max(11, Math.round(width * 0.052));
  const stepX = Math.round(size * 13);
  const stepY = Math.round(size * 4.2);
  const rows: string[] = [];
  for (let y = -stepY; y < height + stepY; y += stepY) {
    for (let x = -stepX; x < width + stepX; x += stepX) {
      rows.push(
        `<text x="${x}" y="${y}" transform="rotate(-22 ${x} ${y})" font-family="'Big Shoulders Display', Impact, sans-serif" font-weight="800" font-size="${size}" letter-spacing="${(size * 0.12).toFixed(1)}" paint-order="stroke fill" stroke="rgba(245,243,238,0.38)" stroke-width="${(size * 0.06).toFixed(2)}" fill="rgba(18,17,15,0.34)">SM FOTO STUDIO</text>`,
      );
    }
  }
  return `<g>${rows.join("")}</g><rect width="${width}" height="${height}" fill="rgba(245,243,238,0.10)"/>`;
}

/**
 * Mock derivat: sinteticni kadar, deterministican po photoId.
 *
 * Prave fotografije NE prolaze ovuda. One se peku pri ingestu
 * (scripts/bake.ts) i sluze se sa diska kroz src/lib/derivatives.ts.
 *
 * Ranije je ovdje stajao i "picsum" izvor koji je pravu fotografiju ubacivao
 * kao base64 <image> u SVG, pa preko nje crtao zig kao SVG tekst. To je bio
 * overlay: cista slika je putovala do klijenta u svakom wm odgovoru i bilo je
 * dovoljno obrisati jedan <g> iz SVG-a. Uklonjeno — zig se pece u piksele ili
 * ga nema.
 */
export async function renderMockPhoto(args: BuildArgs): Promise<string> {
  return buildSyntheticSvg(args);
}
