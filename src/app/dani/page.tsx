import { SiteNav } from "@/components/SiteNav";
import { DatesScreen } from "@/components/DatesScreen";

export default function DatesPage() {
  return (
    <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>
      <SiteNav help narrow tagline="appName" />
      <DatesScreen />
    </main>
  );
}
