export type Equipment = 'bodyweight' | 'dumbbell' | 'kettlebell' | 'band' | 'ball' | 'other';
export type DoseMode = 'reps' | 'time';

export interface Dose {
  mode: DoseMode;
  setsMin: number | null;
  setsMax: number | null;
  repsMin: number | null;
  repsMax: number | null;
  durationSeconds: number | null;
}

export interface Exercise extends Dose {
  id: string;
  name: string;
  equipment: Equipment;
  notes: string | null;
  videoUrl: string | null;
  isIdea: boolean;
  muscleGroups: string[]; // slugs
}

export interface ProgramEntry extends Dose {
  id: string;
  position: number;
  isWarmup: boolean;
  exercise: Pick<Exercise, 'id' | 'name' | 'muscleGroups'>;
}

export interface ProgramSummary {
  id: string;
  name: string;
  exerciseCount: number;
  weekdays: number[]; // ISO weekdays it's scheduled on
}

export interface Program {
  id: string;
  name: string;
  notes: string | null;
  entries: ProgramEntry[];
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD, Denmark date
  weekday: number; // ISO, 1 = Monday
  startTime: string | null; // HH:MM Denmark time, null on rest days
  program: Pick<ProgramSummary, 'id' | 'name' | 'exerciseCount'> | null;
  isOverride: boolean;
}

/** What the exercise form saves: everything except the id. */
export type ExerciseInput = Omit<Exercise, 'id'>;

export interface ProgramEntryInput extends Dose {
  exerciseId: string;
  isWarmup: boolean;
}

/** What the program editor saves in one go. */
export interface ProgramInput {
  name: string;
  entries: ProgramEntryInput[]; // in order
  weekdays: number[];
}

export interface ScheduleSlot {
  weekday: number;
  programId: string;
  programName: string;
}
