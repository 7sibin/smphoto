import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { CodeScreen } from "@/components/CodeScreen";

export const metadata: Metadata = {
  title: "Preuzmi svoje fotografije — SM Foto Studio",
  description: "Ukucaj kod sa kartice i otvori galeriju svoje grupe.",
};

/**
 * Puni ekran za unos koda — sa feedom, brojacem pokusaja i 410 ekranima.
 * Do naslovne je bio na "/", pa je hero preuzeo kratku verziju unosa.
 */
export default function CodePage() {
  return (
    <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>
      <SiteNav help tagline="appName" />
      <CodeScreen />
    </main>
  );
}
