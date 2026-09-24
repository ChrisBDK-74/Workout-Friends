import type { DoseMode, Equipment, Exercise, ExerciseInput } from './types';

/** Form fields are strings while editing; they're parsed on save. */
export interface ExerciseFormValues {
  name: string;
  muscleGroups: string[];
  equipment: Equipment;
  mode: DoseMode;
  sets: string; // "3" or "3-4"
  reps: string; // "12" or "12-15"
  seconds: string; // "45"
  notes: string;
  videoUrl: string;
  isIdea: boolean;
}

export type ExerciseFormField = 'name' | 'sets' | 'reps' | 'seconds' | 'videoUrl';
export type ExerciseFormErrors = Partial<Record<ExerciseFormField, string>>;

export function formatRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return '';
  if (min == null || max == null || min === max) return String(min ?? max);
  return `${min}–${max}`;
}

export function valuesFromExercise(exercise: Exercise | null): ExerciseFormValues {
  return {
    name: exercise?.name ?? '',
    muscleGroups: exercise?.muscleGroups ?? [],
    equipment: exercise?.equipment ?? 'bodyweight',
    mode: exercise?.mode ?? 'reps',
    sets: exercise ? formatRange(exercise.setsMin, exercise.setsMax) : '',
    reps: exercise ? formatRange(exercise.repsMin, exercise.repsMax) : '',
    seconds: exercise?.durationSeconds ? String(exercise.durationSeconds) : '',
    notes: exercise?.notes ?? '',
    videoUrl: exercise?.videoUrl ?? '',
    isIdea: exercise?.isIdea ?? false,
  };
}

type RangeResult = { ok: true; min: number | null; max: number | null } | { ok: false; message: string };

/** Accepts "", "3", "3-4", "3–4" or "3 to 4". */
export function parseRange(text: string, max = 999): RangeResult {
  const trimmed = text.trim();
  if (trimmed === '') return { ok: true, min: null, max: null };
  const match = trimmed.match(/^(\d+)\s*(?:[-–—]|to)?\s*(\d+)?$/i);
  if (!match || (match[2] === undefined && /[-–—]|to/i.test(trimmed))) {
    return { ok: false, message: 'Use a number like 3, or a range like 3–4.' };
  }
  const low = Number(match[1]);
  const high = match[2] !== undefined ? Number(match[2]) : low;
  if (low < 1) return { ok: false, message: 'Use 1 or more.' };
  if (high > max) return { ok: false, message: `Use ${max} or less.` };
  if (high < low) return { ok: false, message: 'Put the lower number first, like 3–4.' };
  return { ok: true, min: low, max: high };
}

export function validateExercise(values: ExerciseFormValues): {
  input: ExerciseInput | null;
  errors: ExerciseFormErrors;
} {
  const errors: ExerciseFormErrors = {};

  const name = values.name.trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'Give the exercise a name.';

  const sets = parseRange(values.sets, 20);
  if (!sets.ok) errors.sets = sets.message;

  let repsMin: number | null = null;
  let repsMax: number | null = null;
  let durationSeconds: number | null = null;

  if (values.mode === 'reps') {
    const reps = parseRange(values.reps, 500);
    if (!reps.ok) errors.reps = reps.message;
    else {
      repsMin = reps.min;
      repsMax = reps.max;
    }
  } else if (values.seconds.trim() !== '') {
    const seconds = Number(values.seconds.trim());
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) {
      errors.seconds = 'Use whole seconds between 1 and 3600.';
    } else {
      durationSeconds = seconds;
    }
  }

  const videoUrl = values.videoUrl.trim();
  if (videoUrl) {
    try {
      const url = new URL(videoUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    } catch {
      errors.videoUrl = 'Paste a full link starting with https://';
    }
  }

  if (Object.keys(errors).length > 0) return { input: null, errors };

  return {
    errors,
    input: {
      name,
      muscleGroups: values.muscleGroups,
      equipment: values.equipment,
      mode: values.mode,
      setsMin: sets.ok ? sets.min : null,
      setsMax: sets.ok ? sets.max : null,
      repsMin,
      repsMax,
      durationSeconds,
      notes: values.notes.trim() || null,
      videoUrl: videoUrl || null,
      isIdea: values.isIdea,
    },
  };
}
