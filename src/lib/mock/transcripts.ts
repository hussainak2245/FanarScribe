import type { TranscriptLine } from "@/types/transcript";

export const transcripts: Record<string, TranscriptLine[]> = {
  E001: [
    {
      id: "T001",
      encounterId: "E001",
      speaker: "Doctor",
      timestamp: "00:12",
      text: "صباح الخير مريم، خبريني عن الكتمة اللي ذكرتيها في التقرير.",
      language: "ar"
    },
    {
      id: "T002",
      encounterId: "E001",
      speaker: "Patient",
      timestamp: "00:25",
      text: "دكتور عندي كتمة من أمس، أحس صدري ضاغط شوي ومع السعال يزيد.",
      language: "ar",
      uncertainTerms: [
        {
          term: "كتمة",
          prompt: "Does كتمة mean chest tightness, shortness of breath, or both?"
        }
      ]
    },
    {
      id: "T003",
      encounterId: "E001",
      speaker: "Doctor",
      timestamp: "00:51",
      text: "هل في صفير، حرارة، أو ألم ينتقل لليد؟ وهل استخدمتي البخاخ؟",
      language: "ar"
    },
    {
      id: "T004",
      encounterId: "E001",
      speaker: "Patient",
      timestamp: "01:08",
      text: "ما في حرارة، بس يمكن صفير خفيف. استخدمت البخاخ مرة بالليل وتحسنت شوي.",
      language: "ar"
    },
    {
      id: "T005",
      encounterId: "E001",
      speaker: "Doctor",
      timestamp: "01:40",
      text: "خلينا نقيس الأكسجين ونراجع السكر والأدوية.",
      language: "ar"
    }
  ],
  E002: [
    {
      id: "T101",
      encounterId: "E002",
      speaker: "Patient",
      timestamp: "00:17",
      text: "الضغط في البيت غالبا 145 على 90، وأحيانا أنسى الحبة.",
      language: "ar"
    },
    {
      id: "T102",
      encounterId: "E002",
      speaker: "Doctor",
      timestamp: "00:38",
      text: "خلينا نثبت طريقة القياس ونراجع الملح والنشاط.",
      language: "ar"
    }
  ],
  E003: [
    {
      id: "T201",
      encounterId: "E003",
      speaker: "Patient",
      timestamp: "00:11",
      text: "الصداع قوي من ثلاثة أيام، ومعاه nausea بس النظر طبيعي.",
      language: "mixed"
    },
    {
      id: "T202",
      encounterId: "E003",
      speaker: "Doctor",
      timestamp: "00:34",
      text: "هل الصداع جديد تماما أو أسوأ صداع بحياتك؟",
      language: "ar"
    }
  ]
};

export function getTranscript(encounterId: string) {
  return transcripts[encounterId] ?? transcripts.E001;
}
