import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { CategoryGallery } from "@/components/CategoryGallery";
import { CATEGORY_ORDER, isCategory } from "@/lib/categories";
import { STRINGS, t as translate } from "@/lib/i18n";

type Params = { params: Promise<{ kategorija: string }> };

export function generateStaticParams() {
  return CATEGORY_ORDER.map((kategorija) => ({ kategorija }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { kategorija } = await params;
  if (!isCategory(kategorija)) return {};
  const name = STRINGS[
    kategorija === "rafting"
      ? "navRafting"
      : kategorija === "vencanja"
        ? "navWeddings"
        : kategorija === "krstenja"
          ? "navBaptisms"
          : "navBirthdays"
  ][0];
  return {
    title: `${name} — SM Foto Studio`,
    description: translate("bs", "catKicker") + " · " + name,
  };
}

export default async function CategoryPage({ params }: Params) {
  const { kategorija } = await params;
  if (!isCategory(kategorija)) notFound();

  return (
    <>
      <SiteNav />
      <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>
        <CategoryGallery slug={kategorija} />
        <SiteFooter variant="slim" />
      </main>
    </>
  );
}
