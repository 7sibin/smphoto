import { Gallery } from "@/components/Gallery";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Gallery sessionId={id} />;
}
