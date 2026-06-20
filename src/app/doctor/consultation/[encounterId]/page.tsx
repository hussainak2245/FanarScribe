import type { Metadata } from "next";
import { SajilWorkspace } from "@/features/consultation/SajilWorkspace";

export const metadata: Metadata = {
  title: "Scribes"
};

export default async function ConsultationWorkspacePage({ params }: { params: Promise<{ encounterId: string }> }) {
  const { encounterId } = await params;
  return <SajilWorkspace encounterId={encounterId} />;
}
