import type { Equipment } from './types';

/** Session times are stored in Stefan's time zone and converted for everyone else. */
export const ANCHOR_TIME_ZONE = 'Europe/Copenhagen';

export const PEOPLE = [
  { name: 'Stefan', timeZone: 'Europe/Copenhagen', place: 'Denmark', initial: 'S' },
  { name: 'Christian', timeZone: 'Asia/Tokyo', place: 'Japan', initial: 'C' },
] as const;

/** Mirrors the muscle_groups table (seed.sql). The list is fixed, so it lives in code too. */
export const MUSCLE_GROUPS = [
  { slug: 'chest', name: 'Chest' },
  { slug: 'shoulders', name: 'Shoulders' },
  { slug: 'biceps', name: 'Biceps' },
  { slug: 'triceps', name: 'Triceps' },
  { slug: 'back', name: 'Back' },
  { slug: 'core', name: 'Core' },
  { slug: 'obliques', name: 'Obliques' },
  { slug: 'lower-back', name: 'Lower back' },
  { slug: 'glutes', name: 'Glutes' },
  { slug: 'quads', name: 'Quads' },
  { slug: 'hamstrings', name: 'Hamstrings' },
  { slug: 'calves', name: 'Calves' },
] as const;

const groupNames: Record<string, string> = Object.fromEntries(
  MUSCLE_GROUPS.map((g) => [g.slug, g.name]),
);

export function muscleGroupName(slug: string): string {
  return groupNames[slug] ?? slug;
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  bodyweight: 'Bodyweight',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  band: 'Band',
  ball: 'Ball',
  other: 'Other',
};
