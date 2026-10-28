// Calendar dates as ISO strings (YYYY-MM-DD), computed in UTC so that adding days never crosses a DST edge.
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = n => String(n).padStart(2, '0');
const toUTC = iso => new Date(`${iso}T00:00:00Z`);
const fromUTC = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** The device's local calendar date. */
export function deviceToday() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function addDays(iso, n) { const d = toUTC(iso); d.setUTCDate(d.getUTCDate() + n); return fromUTC(d); }
export function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
export function weekday(iso) { return WEEKDAYS[(toUTC(iso).getUTCDay() + 6) % 7]; }
export function mondayOnOrBefore(iso) { return addDays(iso, -WEEKDAYS.indexOf(weekday(iso))); }
export function mondayOnOrAfter(iso) { const i = WEEKDAYS.indexOf(weekday(iso)); return i === 0 ? iso : addDays(iso, 7 - i); }
export function isIso(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUTC(s).getTime()); }

/** "Tue 10 Nov" (adds the year when it differs from the reference year). */
export function fmtDate(iso, refIso) {
  if (!isIso(iso)) return '';
  const d = toUTC(iso);
  const y = refIso && refIso.slice(0, 4) !== iso.slice(0, 4) ? ` ${d.getUTCFullYear()}` : '';
  return `${weekday(iso)} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${y}`;
}

/** Local timestamp with offset, e.g. 2026-11-03T19:42:10+01:00 (12 §3.10: dates are local to the runner). */
export function localTimestamp(d = new Date()) {
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}
/** Evening timestamp of a given date, used in tester mode so a simulated entry counts as logged the same day. */
export function eveningTimestamp(iso) {
  const off = -new Date(`${iso}T20:00:00`).getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${iso}T20:00:00${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}
export function timeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}
