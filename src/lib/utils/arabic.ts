export function containsArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

export function arabicGreeting(hour = new Date().getHours()) {
  if (hour < 12) return "صباح الخير";
  if (hour < 18) return "مساء الخير";
  return "مساء الهدوء";
}
