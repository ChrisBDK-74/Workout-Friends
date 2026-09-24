import type { Dose } from './types';

function range(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min == null || max == null || min === max) return String(min ?? max);
  return `${min}–${max}`;
}

/** "3–4 × 12–15", "3 × 45 s", or "Timed" */
export function formatDose(dose: Dose): string {
  const sets = range(dose.setsMin, dose.setsMax);
  const amount =
    dose.mode === 'time'
      ? dose.durationSeconds
        ? `${dose.durationSeconds} s`
        : 'timed'
      : range(dose.repsMin, dose.repsMax);
  if (!sets && !amount) return '';
  if (!sets) return amount ?? '';
  if (!amount) return `${sets} sets`;
  return `${sets} × ${amount}`;
}
