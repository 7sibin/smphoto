import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeIntro } from "@/components/home/HomeIntro";
import { Hero } from "@/components/home/Hero";
import { RaftingSection } from "@/components/home/RaftingSection";
import { ContactSection } from "@/components/home/ContactSection";

/**
 * Naslovna iz "SM Foto Studio.dc.html". Traka menija je fiksirana preko
 * heroa, pa stoji izvan <main> toka.
 */
export default function HomePage() {
  return (
    <>
      <HomeIntro />
      <SiteNav variant="overlay" />
      <main>
        <Hero />
        <RaftingSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
