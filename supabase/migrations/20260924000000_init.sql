-- Workout Friends: initial schema
-- Run once in the Supabase SQL editor, or with `supabase db push`.
--
-- Layers:
--   exercises (+ muscle groups)  -> the library
--   programs (+ program_exercises) -> reusable workouts with sets/reps per exercise
--   weekly_schedule (+ session_overrides) -> the calendar
--
-- Session times are stored as wall-clock time in Denmark (Europe/Copenhagen).
-- The app converts them for each viewer, so daylight-saving changes are handled
-- automatically.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Members: only these email addresses can read or write anything
-- ---------------------------------------------------------------------------

create table public.allowed_users (
  email text primary key check (email = lower(email))
);

-- RLS on with no policies: the list can only be edited from the SQL editor.
alter table public.allowed_users enable row level security;

create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_users
    where email = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_member() from public;
grant execute on function public.is_member() to authenticated;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Library
-- ---------------------------------------------------------------------------

create table public.muscle_groups (
  slug text primary key,
  name text not null unique,
  sort_order smallint not null
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  equipment text not null default 'bodyweight'
    check (equipment in ('bodyweight', 'dumbbell', 'kettlebell', 'band', 'ball', 'other')),
  -- Defaults copied into a program when the exercise is added to it
  mode text not null default 'reps' check (mode in ('reps', 'time')),
  sets_min smallint check (sets_min > 0),
  sets_max smallint,
  reps_min smallint check (reps_min > 0),
  reps_max smallint,
  duration_seconds smallint check (duration_seconds > 0),
  notes text,
  video_url text,
  -- Ideas are exercises you want to try but haven't used in a program yet
  is_idea boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sets_max is null or sets_min is null or sets_max >= sets_min),
  check (reps_max is null or reps_min is null or reps_max >= reps_min)
);

create unique index exercises_name_unique on public.exercises (lower(name));

create trigger exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

create table public.exercise_muscle_groups (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  muscle_group text not null references public.muscle_groups (slug) on update cascade,
  primary key (exercise_id, muscle_group)
);

create index exercise_muscle_groups_group_idx on public.exercise_muscle_groups (muscle_group);

-- ---------------------------------------------------------------------------
-- Programs
-- ---------------------------------------------------------------------------

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index programs_name_unique on public.programs (lower(name));

create trigger programs_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  -- Deleting an exercise also removes it from every program
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position smallint not null check (position > 0),
  is_warmup boolean not null default false,
  mode text not null default 'reps' check (mode in ('reps', 'time')),
  sets_min smallint check (sets_min > 0),
  sets_max smallint,
  reps_min smallint check (reps_min > 0),
  reps_max smallint,
  duration_seconds smallint check (duration_seconds > 0),
  check (sets_max is null or sets_min is null or sets_max >= sets_min),
  check (reps_max is null or reps_min is null or reps_max >= reps_min),
  -- Deferrable so a reorder can swap positions inside one statement
  constraint program_exercises_position_unique
    unique (program_id, position) deferrable initially deferred
);

create index program_exercises_exercise_idx on public.program_exercises (exercise_id);

-- Reorder a program in one call: pass the entry ids in their new order.
create or replace function public.reorder_program(p_program_id uuid, p_entry_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update public.program_exercises
  set position = array_position(p_entry_ids, id)
  where program_id = p_program_id
    and id = any (p_entry_ids);
$$;

grant execute on function public.reorder_program(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Calendar
-- ---------------------------------------------------------------------------

-- The regular week: at most one program per weekday (ISO: 1 = Monday, 7 = Sunday)
create table public.weekly_schedule (
  weekday smallint primary key check (weekday between 1 and 7),
  program_id uuid not null references public.programs (id) on delete cascade,
  start_time time not null default '06:00', -- Denmark time
  updated_at timestamptz not null default now()
);

create trigger weekly_schedule_updated_at
  before update on public.weekly_schedule
  for each row execute function public.set_updated_at();

-- One-off changes for a specific date. program_id null = rest day that date.
create table public.session_overrides (
  session_date date primary key,
  program_id uuid references public.programs (id) on delete cascade,
  start_time time, -- Denmark time; null = use the weekly schedule's time
  note text,
  updated_at timestamptz not null default now()
);

create trigger session_overrides_updated_at
  before update on public.session_overrides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: members only
-- ---------------------------------------------------------------------------

alter table public.muscle_groups enable row level security;
create policy "members read muscle groups" on public.muscle_groups
  for select to authenticated using (public.is_member());

do $$
declare
  t text;
begin
  foreach t in array array[
    'exercises',
    'exercise_muscle_groups',
    'programs',
    'program_exercises',
    'weekly_schedule',
    'session_overrides'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "members read" on public.%I for select to authenticated using (public.is_member())',
      t
    );
    execute format(
      'create policy "members insert" on public.%I for insert to authenticated with check (public.is_member())',
      t
    );
    execute format(
      'create policy "members update" on public.%I for update to authenticated using (public.is_member()) with check (public.is_member())',
      t
    );
    execute format(
      'create policy "members delete" on public.%I for delete to authenticated using (public.is_member())',
      t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: changes one of you makes show up for the other immediately
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table
  public.exercises,
  public.exercise_muscle_groups,
  public.programs,
  public.program_exercises,
  public.weekly_schedule,
  public.session_overrides;
