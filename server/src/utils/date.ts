export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function weekStartStr(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  date.setDate(date.getDate() + diff);
  return date.toISOString().slice(0, 10);
}

export function monthStr(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7); // YYYY-MM
}

export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
