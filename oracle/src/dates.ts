// Plain calendar arithmetic on ISO local dates (12 §3.10: dates are local; no time zone maths needed).
import type { Weekday } from './types.js';

const DAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toUTC(d: string): number {
  const [y, m, dd] = d.split('-').map(Number);
  return Date.UTC(y, m - 1, dd);
}
export function addDays(d: string, n: number): string {
  return new Date(toUTC(d) + n * 86400000).toISOString().slice(0, 10);
}
/** days_between(d1, d2) = d2 − d1 (12 §2b.3). */
export function daysBetween(d1: string, d2: string): number {
  return Math.round((toUTC(d2) - toUTC(d1)) / 86400000);
}
export function weekday(d: string): Weekday {
  return DAYS[(new Date(toUTC(d)).getUTCDay() + 6) % 7];
}
export function mondayOf(d: string): string {
  return addDays(d, -DAYS.indexOf(weekday(d)));
}
/** INP-002 age_low: age on d assuming the birthday is the LAST day of the birth month. */
export function ageLow(birthYear: number, birthMonth: number, d: string): number {
  const last = new Date(Date.UTC(birthYear, birthMonth, 0)).getUTCDate();
  return ageOn(birthYear, birthMonth, last, d);
}
/** INP-002 age_high: birthday assumed on the FIRST day of the birth month. */
export function ageHigh(birthYear: number, birthMonth: number, d: string): number {
  return ageOn(birthYear, birthMonth, 1, d);
}
function ageOn(y: number, m: number, day: number, d: string): number {
  const [yy, mm, dd] = d.split('-').map(Number);
  let a = yy - y;
  if (mm < m || (mm === m && dd < day)) a -= 1;
  return a;
}
