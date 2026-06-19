export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-QA", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-QA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
