import { MessageCircle } from "lucide-react";

const messages = [
  { speaker: "SAJIL", text: "متى بدأت الأعراض؟" },
  { speaker: "Patient", text: "من أمس، أحس بكتمة مع سعال خفيف." },
  { speaker: "SAJIL", text: "هل الكتمة ضيق نفس، ضغط في الصدر، أو الاثنين؟" }
];

export function SymptomChatMock() {
  return (
    <div className="rounded-app bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-accent-500" aria-hidden="true" />
        <h2 className="text-lg font-medium text-zinc-950">محادثة الأعراض</h2>
      </div>
      <div className="space-y-2">
        {messages.map((message) => (
          <div
            key={`${message.speaker}-${message.text}`}
            className={message.speaker === "Patient" ? "rounded-app bg-zinc-50 p-3" : "rounded-app bg-accent-50 p-3"}
            dir="rtl"
          >
            <p className="text-xs font-medium text-zinc-400">{message.speaker}</p>
            <p className="arabic-text mt-1 text-sm leading-7 text-zinc-700">{message.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
