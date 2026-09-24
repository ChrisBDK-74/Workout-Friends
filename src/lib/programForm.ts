import { formatRange, parseRange } from './exerciseForm';
import type { DoseMode, Exercise, Program, ProgramInput } from './types';

/** One row in the editor. Numbers stay strings while editing. */
export interface EntryDraft {
  key: string; // stable id for React and drag-and-drop
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  isWarmup: boolean;
  mode: DoseMode;
  sets: string;
  reps: string;
  seconds: string;
}

export interface ProgramDraft {
  name: string;
  entries: EntryDraft[];
  weekdays: number[];
}

export type EntryField = 'sets' | 'reps' | 'seconds';
export type EntryErrors = Partial<Record<EntryField, string>>;

export interface ProgramErrors {
  name?: string;
  entries: Record<string, EntryErrors>; // by entry key
}

let keyCounter = 0;
// Not crypto.randomUUID: that's missing on plain-http LAN addresses (testing on a phone).
const nextKey = () => `entry-${++keyCounter}`;

export function entryFromExercise(exercise: Exercise): EntryDraft {
  return {
    key: nextKey(),
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroups: exercise.muscleGroups,
    isWarmup: false,
    mode: exercise.mode,
    sets: formatRange(exercise.setsMin, exercise.setsMax),
    reps: formatRange(exercise.repsMin, exercise.repsMax),
    seconds: exercise.durationSeconds ? String(exercise.durationSeconds) : '',
  };
}

export function draftFromProgram(program: Program | null, weekdays: number[]): ProgramDraft {
  return {
    name: program?.name ?? '',
    weekdays: [...weekdays].sort(),
    entries: (program?.entries ?? []).map((e) => ({
      key: nextKey(),
      exerciseId: e.exercise.id,
      name: e.exercise.name,
      muscleGroups: e.exercise.muscleGroups,
      isWarmup: e.isWarmup,
      mode: e.mode,
      sets: formatRange(e.setsMin, e.setsMax),
      reps: formatRange(e.repsMin, e.repsMax),
      seconds: e.durationSeconds ? String(e.durationSeconds) : '',
    })),
  };
}

/** Compares everything except the React keys, to know if there are unsaved changes. */
export function draftSignature(draft: ProgramDraft): string {
  return JSON.stringify({
    ...draft,
    entries: draft.entries.map(({ key: _key, ...rest }) => rest),
  });
}

export function validateProgram(draft: ProgramDraft): { input: ProgramInput | null; errors: ProgramErrors } {
  const errors: ProgramErrors = { entries: {} };
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'Give the program a name.';

  const entries = draft.entries.map((entry) => {
    const entryErrors: EntryErrors = {};
    const sets = parseRange(entry.sets, 20);
    if (!sets.ok) entryErrors.sets = sets.message;

    let repsMin: number | null = null;
    let repsMax: number | null = null;
    let durationSeconds: number | null = null;

    if (entry.mode === 'reps') {
      const reps = parseRange(entry.reps, 500);
      if (!reps.ok) entryErrors.reps = reps.message;
      else {
        repsMin = reps.min;
        repsMax = reps.max;
      }
    } else if (entry.seconds.trim() !== '') {
      const seconds = Number(entry.seconds.trim());
      if (!Number.isInteger(seconds) || seconds < 1 || seconds > 3600) {
        entryErrors.seconds = 'Use whole seconds between 1 and 3600.';
      } else {
        durationSeconds = seconds;
      }
    }

    if (Object.keys(entryErrors).length > 0) errors.entries[entry.key] = entryErrors;

    return {
      exerciseId: entry.exerciseId,
      isWarmup: entry.isWarmup,
      mode: entry.mode,
      setsMin: sets.ok ? sets.min : null,
      setsMax: sets.ok ? sets.max : null,
      repsMin,
      repsMax,
      durationSeconds,
    };
  });

  const hasErrors = Boolean(errors.name) || Object.keys(errors.entries).length > 0;
  return {
    errors,
    input: hasErrors ? null : { name, entries, weekdays: [...draft.weekdays].sort() },
  };
}
