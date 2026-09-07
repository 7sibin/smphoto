import { SiteNav } from "@/components/SiteNav";
import { CodeScreen } from "@/components/CodeScreen";
import { normalizeCode } from "@/lib/codeFormat";

/**
 * QR deep link sa kartice: /g/K7XM4Q2P.
 * Kod se samo popunjava — provjeru i dalje radi /api/access.
 */
export default async function DeepLinkPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column" }}>
      <SiteNav help tagline="appName" />
      <CodeScreen initialCode={normalizeCode(decodeURIComponent(code))} />
    </main>
  );
}
