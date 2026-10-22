// ISO local dates (12 §3.10). Arithmetic on calendar days via UTC, so time zones never shift a date.
export type ISODate = string;
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export function toDays(d: ISODate): number {
  const [y, m, dd] = d.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, dd) / 86400000);
}
export function fromDays(n: number): ISODate {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}
export const addDays = (d: ISODate, n: number): ISODate => fromDays(toDays(d) + n);
export const daysBetween = (a: ISODate, b: ISODate): number => toDays(b) - toDays(a);
/** Monday = 0 … Sunday = 6 */
export const weekdayIndex = (d: ISODate): number => (((toDays(d) + 3) % 7) + 7) % 7; // 1970-01-01 was a Thursday
export const weekday = (d: ISODate): Weekday => WEEKDAYS[weekdayIndex(d)];
export const mondayOf = (d: ISODate): ISODate => addDays(d, -weekdayIndex(d));
export function isoWeek(d: ISODate): string {
  const days = toDays(d);
  const thursday = days - weekdayIndex(d) + 3;
  const year = new Date(thursday * 86400000).getUTCFullYear();
  const jan1 = toDays(`${year}-01-01`);
  const week = Math.floor((thursday - jan1) / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}
/** hours between two timestamps or dates (dates read as 00:00 local) */
export function hoursBetween(a: string, b: string): number {
  const t = (s: string) => (s.length <= 10 ? toDays(s) * 24 : Date.parse(s) / 3600000);
  return t(b) - t(a);
}
