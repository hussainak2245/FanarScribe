import { SajilWorkspace } from "@/features/consultation/SajilWorkspace";

export default async function ConsultationWorkspacePage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  return <SajilWorkspace encounterId={encounterId} />;
}
