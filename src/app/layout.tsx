import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders } from "next/font/google";
import { LangProvider } from "@/components/LangContext";
import { StyledJsxRegistry } from "@/components/StyledJsxRegistry";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-archivo",
  display: "swap",
});

// Google je "Big Shoulders Display" iz dizajna preimenovao u "Big Shoulders".
// Isti crtez slova, isti raspon tezina.
const shoulders = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
  variable: "--font-shoulders",
  display: "swap",
  // Next nema metrike za preimenovani font, pa ne moze sam da racuna
  // size-adjust za fallback. Zadajemo ga rucno umjesto da build upozorava.
  adjustFontFallback: false,
  fallback: ["Impact", "Haettenschweiler", "sans-serif"],
});

export const metadata: Metadata = {
  title: "SM Foto Studio — Foča, Tara i Drina",
  description:
    "Fotografija sa raftinga, venčanja, krštenja i rođendana. Galeriju svoje grupe otvarate kodom sa kartice.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f3ee",
  // Zoom ostaje dozvoljen — ljudi gledaju sitne detalje na suncu.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs" className={`${archivo.variable} ${shoulders.variable}`}>
      <body>
        {/* Reveal skriva svoj sadrzaj i ceka IntersectionObserver. Sad kad mu
            CSS stize u SSR HTML-u, to skrivanje vazi i prije hidracije — pa
            se veze za ovu klasu: skrivamo samo ako znamo da mozemo i otkriti.
            Stoji prvo u <body> da bude izvrseno prije nego se Reveal blokovi
            uopste isparsiraju. Bez JS-a klase nema i sadrzaj je vidljiv. */}
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("js")` }}
        />
        <StyledJsxRegistry>
          <LangProvider>{children}</LangProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
