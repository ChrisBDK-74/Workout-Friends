import { supabase } from './supabase';
import { addDays, isoWeekday } from './time';
import type { CalendarDay, Dose, Exercise, Program, ProgramSummary } from './types';

/* Row shapes as returned by PostgREST. Regenerate proper types later with
   `supabase gen types typescript` if you want them checked against the database. */

interface DoseRow {
  mode: Dose['mode'];
  sets_min: number | null;
  sets_max: number | null;
  reps_min: number | null;
  reps_max: number | null;
  duration_seconds: number | null;
}

function toDose(row: DoseRow): Dose {
  return {
    mode: row.mode,
    setsMin: row.sets_min,
    setsMax: row.sets_max,
    repsMin: row.reps_min,
    repsMax: row.reps_max,
    durationSeconds: row.duration_seconds,
  };
}

interface ExerciseRow extends DoseRow {
  id: string;
  name: string;
  equipment: Exercise['equipment'];
  notes: string | null;
  video_url: string | null;
  is_idea: boolean;
  exercise_muscle_groups: { muscle_group: string }[];
}

function toExercise(row: ExerciseRow): Exercise {
  return {
    ...toDose(row),
    id: row.id,
    name: row.name,
    equipment: row.equipment,
    notes: row.notes,
    videoUrl: row.video_url,
    isIdea: row.is_idea,
    muscleGroups: row.exercise_muscle_groups.map((m) => m.muscle_group),
  };
}

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_muscle_groups(muscle_group)')
    .order('name');
  if (error) throw error;
  return (data as ExerciseRow[]).map(toExercise);
}

export async function getExercise(id: string): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*, exercise_muscle_groups(muscle_group)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return toExercise(data as ExerciseRow);
}

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export async function listPrograms(): Promise<ProgramSummary[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, name, program_exercises(count), weekly_schedule(weekday)')
    .order('name');
  if (error) throw error;
  return (
    data as {
      id: string;
      name: string;
      program_exercises: { count: number }[];
      weekly_schedule: { weekday: number }[];
    }[]
  ).map((p) => ({
    id: p.id,
    name: p.name,
    exerciseCount: p.program_exercises[0]?.count ?? 0,
    weekdays: p.weekly_schedule.map((s) => s.weekday).sort(),
  }));
}

interface ProgramEntryRow extends DoseRow {
  id: string;
  position: number;
  is_warmup: boolean;
  exercise: { id: string; name: string; exercise_muscle_groups: { muscle_group: string }[] };
}

export async function getProgram(id: string): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .select(
      'id, name, notes, program_exercises(*, exercise:exercises(id, name, exercise_muscle_groups(muscle_group)))',
    )
    .eq('id', id)
    .order('position', { referencedTable: 'program_exercises' })
    .single();
  if (error) throw error;
  const row = data as { id: string; name: string; notes: string | null; program_exercises: ProgramEntryRow[] };
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    entries: row.program_exercises.map((e) => ({
      ...toDose(e),
      id: e.id,
      position: e.position,
      isWarmup: e.is_warmup,
      exercise: {
        id: e.exercise.id,
        name: e.exercise.name,
        muscleGroups: e.exercise.exercise_muscle_groups.map((m) => m.muscle_group),
      },
    })),
  };
}

export async function reorderProgram(programId: string, entryIdsInOrder: string[]): Promise<void> {
  const { error } = await supabase.rpc('reorder_program', {
    p_program_id: programId,
    p_entry_ids: entryIdsInOrder,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

type ProgramRef = { id: string; name: string; program_exercises: { count: number }[] } | null;

const toProgramRef = (p: ProgramRef) =>
  p ? { id: p.id, name: p.name, exerciseCount: p.program_exercises[0]?.count ?? 0 } : null;

/** Seven days starting at weekStart (a Monday), weekly schedule merged with one-off changes. */
export async function getWeek(weekStart: string): Promise<CalendarDay[]> {
  const weekEnd = addDays(weekStart, 6);
  const programSelect = 'program:programs(id, name, program_exercises(count))';

  const [schedule, overrides] = await Promise.all([
    supabase.from('weekly_schedule').select(`weekday, start_time, ${programSelect}`),
    supabase
      .from('session_overrides')
      .select(`session_date, start_time, ${programSelect}`)
      .gte('session_date', weekStart)
      .lte('session_date', weekEnd),
  ]);
  if (schedule.error) throw schedule.error;
  if (overrides.error) throw overrides.error;

  const byWeekday = new Map(
    (schedule.data as unknown as { weekday: number; start_time: string; program: ProgramRef }[]).map((s) => [
      s.weekday,
      s,
    ]),
  );
  const byDate = new Map(
    (
      overrides.data as unknown as { session_date: string; start_time: string | null; program: ProgramRef }[]
    ).map((o) => [o.session_date, o]),
  );

  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const weekday = isoWeekday(date);
    const regular = byWeekday.get(weekday);
    const override = byDate.get(date);

    if (override) {
      const program = toProgramRef(override.program);
      return {
        date,
        weekday,
        program,
        startTime: program ? (override.start_time ?? regular?.start_time ?? '06:00').slice(0, 5) : null,
        isOverride: true,
      };
    }
    return {
      date,
      weekday,
      program: toProgramRef(regular?.program ?? null),
      startTime: regular ? regular.start_time.slice(0, 5) : null,
      isOverride: false,
    };
  });
}

export async function getDay(date: string): Promise<CalendarDay> {
  const week = await getWeek(addDays(date, 1 - isoWeekday(date)));
  const day = week.find((d) => d.date === date);
  if (!day) throw new Error(`No calendar entry for ${date}`);
  return day;
}
