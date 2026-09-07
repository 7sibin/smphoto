import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { AboutScreen } from "@/components/AboutScreen";

export const metadata: Metadata = {
  title: "O nama — SM Foto Studio",
  description: "Sreten Milutinović, fotograf iz Foče. Rafting, venčanja, krštenja i rođendani.",
};

export default function AboutPage() {
  return (
    <>
      <SiteNav narrow />
      <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>
        <AboutScreen />
        <SiteFooter variant="slim" narrow />
      </main>
    </>
  );
}
