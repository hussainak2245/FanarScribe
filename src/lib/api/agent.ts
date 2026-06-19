import { getCheckpoints, getUncertaintyFlags } from "@/lib/mock/uncertainty";
import { mockRequest } from "./client";

export async function scoreUncertainty(encounterId: string) {
  return mockRequest(getUncertaintyFlags(encounterId), 260);
}

export async function resolveCheckpoint(checkpointId: string, answer: string) {
  return mockRequest({
    checkpointId,
    answer,
    status: "resolved",
    resolvedAt: new Date().toISOString()
  });
}

export async function getPhysicianCheckpoints(encounterId: string) {
  return mockRequest(getCheckpoints(encounterId));
}
