import { supabase } from './supabase';
import { addDays, isoWeekday } from './time';
import type {
  CalendarDay,
  Category,
  CategoryKind,
  Dose,
  Exercise,
  ExerciseInput,
  Program,
  ProgramInput,
  ProgramSummary,
  ScheduleSlot,
} from './types';

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
  if (error) throw friendlyError(error);
  return toExercise(data as ExerciseRow);
}

interface ErrorContext {
  name?: string;
  kind?: 'exercise' | 'program';
  migration?: string;
}

/** Turns database errors into messages a person can act on. */
function friendlyError(error: { code?: string; message: string }, context: ErrorContext = {}): Error {
  const thing = context.kind === 'program' ? 'program' : 'exercise';
  switch (error.code) {
    case '23505':
      return new Error(`There's already ${thing === 'program' ? 'a program' : 'an exercise'} called “${context.name}”. Pick another name.`);
    case '23503':
      return new Error('One of the exercises was deleted in the meantime. Reload the page and try again.');
    case '23514':
      return new Error('One of the numbers is out of range. Check sets and reps.');
    case 'PGRST202':
      return new Error(
        `Saving needs a database update: run supabase/migrations/${context.migration ?? '…'} in the Supabase SQL editor.`,
      );
    case 'P0002':
    case 'PGRST116':
      return new Error(`This ${thing} no longer exists. It may have been deleted.`);
    default:
      return new Error(error.message);
  }
}

/** Creates (id = null) or updates an exercise with its muscle groups in one transaction. Returns the id. */
export async function saveExercise(id: string | null, input: ExerciseInput): Promise<string> {
  const { data, error } = await supabase.rpc('save_exercise', {
    p_id: id,
    p_name: input.name,
    p_equipment: input.equipment,
    p_mode: input.mode,
    p_sets_min: input.setsMin,
    p_sets_max: input.setsMax,
    p_reps_min: input.repsMin,
    p_reps_max: input.repsMax,
    p_duration_seconds: input.durationSeconds,
    p_notes: input.notes,
    p_video_url: input.videoUrl,
    p_is_idea: input.isIdea,
    p_muscle_groups: input.muscleGroups,
  });
  if (error) throw friendlyError(error, { name: input.name, migration: '20260925000000_save_exercise.sql' });
  return data as string;
}

/** Deleting also removes the exercise from every program (on delete cascade). */
export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw friendlyError(error);
}

/** Programs that use an exercise, so the delete warning can name them. */
export async function getExerciseUsage(id: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from('program_exercises')
    .select('program:programs(id, name)')
    .eq('exercise_id', id);
  if (error) throw friendlyError(error);
  const programs = new Map<string, string>();
  for (const row of data as unknown as { program: { id: string; name: string } | null }[]) {
    if (row.program) programs.set(row.program.id, row.program.name);
  }
  return [...programs].map(([pid, name]) => ({ id: pid, name })).sort((a, b) => a.name.localeCompare(b.name));
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
  if (error) throw friendlyError(error, { kind: 'program' });
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

/** Saves name, ordered exercises and weekdays in one transaction. Returns the program id. */
export async function saveProgram(id: string | null, input: ProgramInput): Promise<string> {
  const { data, error } = await supabase.rpc('save_program', {
    p_id: id,
    p_name: input.name,
    p_entries: input.entries.map((e) => ({
      exercise_id: e.exerciseId,
      is_warmup: e.isWarmup,
      mode: e.mode,
      sets_min: e.setsMin,
      sets_max: e.setsMax,
      reps_min: e.repsMin,
      reps_max: e.repsMax,
      duration_seconds: e.durationSeconds,
    })),
    p_weekdays: input.weekdays,
  });
  if (error) {
    throw friendlyError(error, { name: input.name, kind: 'program', migration: '20260926000000_save_program.sql' });
  }
  return data as string;
}

/** Also removes it from the weekly schedule and any one-off calendar changes. */
export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw friendlyError(error, { kind: 'program' });
}

export async function getWeeklySchedule(): Promise<ScheduleSlot[]> {
  const { data, error } = await supabase
    .from('weekly_schedule')
    .select('weekday, program:programs(id, name)')
    .order('weekday');
  if (error) throw friendlyError(error);
  return (data as unknown as { weekday: number; program: { id: string; name: string } }[]).map((s) => ({
    weekday: s.weekday,
    programId: s.program.id,
    programName: s.program.name,
  }));
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

const DEFAULT_START_TIME = '06:00';

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
  if (schedule.error) throw friendlyError(schedule.error);
  if (overrides.error) throw friendlyError(overrides.error);

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
    const regularProgram = toProgramRef(regular?.program ?? null);
    const regularStartTime = regular ? regular.start_time.slice(0, 5) : null;

    if (override) {
      const program = toProgramRef(override.program);
      return {
        date,
        weekday,
        program,
        startTime: program ? (override.start_time ?? regular?.start_time ?? DEFAULT_START_TIME).slice(0, 5) : null,
        isOverride: true,
        regularProgram,
        regularStartTime,
      };
    }
    return {
      date,
      weekday,
      program: regularProgram,
      startTime: regularStartTime,
      isOverride: false,
      regularProgram,
      regularStartTime,
    };
  });
}

export async function getDay(date: string): Promise<CalendarDay> {
  const week = await getWeek(addDays(date, 1 - isoWeekday(date)));
  const day = week.find((d) => d.date === date);
  if (!day) throw new Error(`No calendar entry for ${date}`);
  return day;
}

/**
 * Changes a single date. programId null = rest day that date. startTime is Denmark time (HH:MM),
 * or null to keep the weekly schedule's time.
 */
export async function setSessionOverride(date: string, programId: string | null, startTime: string | null) {
  const { error } = await supabase
    .from('session_overrides')
    .upsert({ session_date: date, program_id: programId, start_time: startTime }, { onConflict: 'session_date' });
  if (error) throw friendlyError(error, { kind: 'program' });
}

/** Puts a date back on the weekly schedule. */
export async function clearSessionOverride(date: string) {
  const { error } = await supabase.from('session_overrides').delete().eq('session_date', date);
  if (error) throw friendlyError(error);
}

// ---------------------------------------------------------------------------
// Categories (muscle groups and equipment types)
// ---------------------------------------------------------------------------

const CATEGORY_TABLE: Record<CategoryKind, string> = { muscle: 'muscle_groups', equipment: 'equipment_types' };

export async function listCategories(): Promise<{ muscle: Category[]; equipment: Category[] }> {
  const [muscle, equipment] = await Promise.all([
    supabase.from('muscle_groups').select('slug, name, sort_order, exercise_muscle_groups(count)').order('sort_order'),
    supabase.from('equipment_types').select('slug, name, sort_order, exercises(count)').order('sort_order'),
  ]);
  if (muscle.error) throw categoryError(muscle.error);
  if (equipment.error) throw categoryError(equipment.error);
  type Row = { slug: string; name: string; sort_order: number } & Record<string, unknown>;
  const toCategory = (countKey: string) => (r: Row) => ({
    slug: r.slug,
    name: r.name,
    sortOrder: r.sort_order,
    usage: (r[countKey] as { count: number }[] | undefined)?.[0]?.count ?? 0,
  });
  return {
    muscle: (muscle.data as Row[]).map(toCategory('exercise_muscle_groups')),
    equipment: (equipment.data as Row[]).map(toCategory('exercises')),
  };
}

function categoryError(error: { code?: string; message: string }, name?: string): Error {
  if (error.code === '23505') return new Error(`“${name}” already exists.`);
  if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST202') {
    return new Error(
      'Categories need a database update: run supabase/migrations/20260927000000_categories_and_clear_week.sql in the Supabase SQL editor.',
    );
  }
  return friendlyError(error);
}

export async function addCategory(kind: CategoryKind, slug: string, name: string, sortOrder: number) {
  const { error } = await supabase.from(CATEGORY_TABLE[kind]).insert({ slug, name: name.trim(), sort_order: sortOrder });
  if (error) throw categoryError(error, name.trim());
}

/** Only the display name changes; the slug stays, so exercises keep their links. */
export async function renameCategory(kind: CategoryKind, slug: string, name: string) {
  const { error } = await supabase.from(CATEGORY_TABLE[kind]).update({ name: name.trim() }).eq('slug', slug);
  if (error) throw categoryError(error, name.trim());
}

/** Also removes the muscle group from every exercise that had it. */
export async function deleteMuscleGroup(slug: string) {
  const { error } = await supabase.from('muscle_groups').delete().eq('slug', slug);
  if (error) throw categoryError(error);
}

/** Moves the exercises that use it to another equipment type, then deletes it. */
export async function deleteEquipmentType(slug: string, moveTo: string | null) {
  const { error } = await supabase.rpc('delete_equipment_type', { p_slug: slug, p_move_to: moveTo });
  if (error) throw categoryError(error);
}

// ---------------------------------------------------------------------------
// Clearing and planning whole weeks
// ---------------------------------------------------------------------------

/** Makes every date in the list a rest day, for those dates only. */
export async function clearDates(dates: string[]) {
  const { error } = await supabase
    .from('session_overrides')
    .upsert(
      dates.map((d) => ({ session_date: d, program_id: null, start_time: null })),
      { onConflict: 'session_date' },
    );
  if (error) throw friendlyError(error);
}

/** Removes all one-off changes between two dates, so they follow the weekly schedule again. */
export async function resetDates(from: string, to: string) {
  const { error } = await supabase.from('session_overrides').delete().gte('session_date', from).lte('session_date', to);
  if (error) throw friendlyError(error);
}

/** Empties the weekly schedule and removes one-off changes from `from` onwards. Programs are kept. */
export async function clearWeeklySchedule(from: string) {
  const { error } = await supabase.rpc('clear_weekly_schedule', { p_from: from });
  if (error) throw categoryError(error);
}

/** Sets (or with programId null, empties) a weekday in the weekly schedule. Time is Denmark time. */
export async function setWeeklySlot(weekday: number, programId: string | null, startTime: string) {
  const { error } = programId
    ? await supabase
        .from('weekly_schedule')
        .upsert({ weekday, program_id: programId, start_time: startTime }, { onConflict: 'weekday' })
    : await supabase.from('weekly_schedule').delete().eq('weekday', weekday);
  if (error) throw friendlyError(error, { kind: 'program' });
}
