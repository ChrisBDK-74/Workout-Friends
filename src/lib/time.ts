import { ANCHOR_TIME_ZONE } from './constants';

/* Dates are handled as 'YYYY-MM-DD' strings to avoid local-time surprises. */

function parseIso(iso: string): [number, number, number] {
  const [y, m, d] = iso.split('-').map(Number);
  return [y, m, d];
}

function toIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = parseIso(iso);
  return toIso(Date.UTC(y, m - 1, d + days));
}

/** ISO weekday: 1 = Monday … 7 = Sunday */
export function isoWeekday(iso: string): number {
  const [y, m, d] = parseIso(iso);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(iso: string): string {
  return addDays(iso, 1 - isoWeekday(iso));
}

export function isoWeekNumber(iso: string): number {
  const thursday = addDays(iso, 4 - isoWeekday(iso));
  const [y] = parseIso(thursday);
  const jan1 = Date.UTC(y, 0, 1);
  const [ty, tm, td] = parseIso(thursday);
  return Math.floor((Date.UTC(ty, tm - 1, td) - jan1) / 86_400_000 / 7) + 1;
}

/** Today's date in a given time zone (defaults to the anchor zone). */
export function todayIso(timeZone: string = ANCHOR_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - instant.getTime();
}

/** Turns "2026-09-24 06:00 in Copenhagen" into an absolute moment in time. */
export function zonedToInstant(dateIso: string, time: string, timeZone: string = ANCHOR_TIME_ZONE): Date {
  const [y, m, d] = parseIso(dateIso);
  const [hh, mm] = time.split(':').map(Number);
  const wallClock = Date.UTC(y, m - 1, d, hh, mm);
  const first = offsetMs(new Date(wallClock), timeZone);
  let instant = wallClock - first;
  const second = offsetMs(new Date(instant), timeZone);
  if (second !== first) instant = wallClock - second;
  return new Date(instant);
}

export function formatTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit' }).format(instant);
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  const [y, m, d] = parseIso(iso);
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "21 – 27 September" or "28 September – 4 October" */
export function formatWeekRange(start: string): string {
  const end = addDays(start, 6);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const from = formatDate(start, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' });
  const to = formatDate(end, { day: 'numeric', month: 'long' });
  return `${from} – ${to}`;
}
