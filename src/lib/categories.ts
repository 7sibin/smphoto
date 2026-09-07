import type { StringKey } from "@/lib/i18n";

/**
 * Kategorije javne galerije, iz "Galerija kategorije.dc.html".
 *
 * Rafting je jedini koji ima pravi backend, i to iza koda — galerija grupe
 * se ne otvara bez kartice. Ostale tri su izlog: dizajn ovdje crta plocice
 * iz tonova, jer prave slike nisu povezane. Tonovi, odnosi stranica i
 * prefiks u opisu su prepisani iz prototipa da izlog izgleda isto.
 */

export type CategorySlug = "rafting" | "vencanja" | "krstenja" | "rodjendani";

export type Category = {
  slug: CategorySlug;
  /** Naslov je vlastito ime kategorije — ide kroz meni, pa dijeli kljuc. */
  titleKey: StringKey;
  descKey: StringKey;
  metaKey: StringKey;
  tones: string[];
  prefix: string;
};

export const CATEGORIES: Record<CategorySlug, Category> = {
  rafting: {
    slug: "rafting",
    titleKey: "navRafting",
    descKey: "catRaftingDesc",
    metaKey: "catRaftingMeta",
    tones: ["#d7d2c6", "#cdc8bb", "#e0dbcf", "#c8c3b6"],
    prefix: "RAF",
  },
  vencanja: {
    slug: "vencanja",
    titleKey: "navWeddings",
    descKey: "catWeddingsDesc",
    metaKey: "catWeddingsMeta",
    tones: ["#e6e1d6", "#efece4", "#ddd8cc", "#e9e4d9"],
    prefix: "VEN",
  },
  krstenja: {
    slug: "krstenja",
    titleKey: "navBaptisms",
    descKey: "catBaptismsDesc",
    metaKey: "catYearRound",
    tones: ["#e3ded3", "#d9d4c8", "#eae6dc", "#d2ccc0"],
    prefix: "KRS",
  },
  rodjendani: {
    slug: "rodjendani",
    titleKey: "navBirthdays",
    descKey: "catBirthdaysDesc",
    metaKey: "catYearRound",
    tones: ["#e0d9cb", "#d5cec0", "#e8e1d3", "#cec7b9"],
    prefix: "ROD",
  },
};

export const CATEGORY_ORDER: CategorySlug[] = ["rafting", "vencanja", "krstenja", "rodjendani"];

/** Odnosi stranica se vrte u krug — daju masonry koji ne izgleda pravilno. */
export const TILE_RATIOS = [0.72, 1.34, 1, 0.78, 1.5, 0.68, 1.12, 0.82];

export const TILE_COUNT = 24;

export function isCategory(v: string): v is CategorySlug {
  return Object.prototype.hasOwnProperty.call(CATEGORIES, v);
}
