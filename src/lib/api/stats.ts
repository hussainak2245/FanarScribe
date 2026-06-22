import { API_BASE_URL } from "./client";

export interface DoctorStats {
  signals: number;
  notes_ready: number;
  minutes_saved?: number;
}

export async function getDoctorStats(doctorId = "default"): Promise<DoctorStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/stats/doctor?doctor_id=${doctorId}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return { signals: 0, notes_ready: 0 };
    return res.json() as Promise<DoctorStats>;
  } catch {
    return { signals: 0, notes_ready: 0 };
  }
}
