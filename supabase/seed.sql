-- Workout Friends: starting data, cleaned up from "Online Træning - Stefan & Christian.xlsx"
-- Run once, after the migration.

-- ---------------------------------------------------------------------------
-- Muscle groups (fixed list)
-- ---------------------------------------------------------------------------

insert into public.muscle_groups (slug, name, sort_order) values
  ('chest',      'Chest',       1),
  ('shoulders',  'Shoulders',   2),
  ('biceps',     'Biceps',      3),
  ('triceps',    'Triceps',     4),
  ('back',       'Back',        5),
  ('core',       'Core',        6),
  ('obliques',   'Obliques',    7),
  ('lower-back', 'Lower back',  8),
  ('glutes',     'Glutes',      9),
  ('quads',      'Quads',      10),
  ('hamstrings', 'Hamstrings', 11),
  ('calves',     'Calves',     12);

-- ---------------------------------------------------------------------------
-- Exercises
-- ---------------------------------------------------------------------------

insert into public.exercises
  (name, equipment, mode, sets_min, sets_max, reps_min, reps_max, notes, is_idea)
values
  -- Monday sheet
  ('Up-Down Plank',          'bodyweight', 'reps', 3, 3,  8,  8, 'Warm-up', false),
  ('Push-ups',               'bodyweight', 'reps', 3, 4, 12, 15, 'Including variations', false),
  ('Hammer Curls',           'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Bench Dips',             'bodyweight', 'reps', 3, 4, 12, 15, null, false),
  ('Concentration Curls',    'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Lateral Raises',         'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Front Raises',           'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Chest Flys',             'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  -- Tuesday sheet
  ('Side Plank Dips',        'bodyweight', 'reps', 2, 3, 12, 12, null, false),
  ('Windshield Wipers',      'bodyweight', 'reps', 2, 3, 12, 12, null, false),
  ('High Boat to Low Boat',  'bodyweight', 'reps', 2, 3, 12, 12, null, false),
  ('Woodchopper',            'kettlebell', 'reps', 2, 3, 12, 12, 'Kettlebell or dumbbell', false),
  ('Overhead Pullover',      'dumbbell',   'reps', 2, 3, 12, 12, null, false),
  ('Mountain Climber',       'bodyweight', 'reps', 2, 3,  8,  8, null, false),
  -- Wednesday sheet
  ('Front / Reverse Lunge',  'bodyweight', 'reps', 2, 3,  8, 10, null, false),
  ('Lateral Squats',         'bodyweight', 'reps', 2, 3,  8, 10, null, false),
  ('Regular Squats',         'bodyweight', 'reps', 2, 3,  8, 10, null, false),
  ('Wall Sit',               'bodyweight', 'time', 2, 3, null, null, 'Timed: set your duration', false),
  ('Band Leg Extension',     'band',       'reps', 2, 3,  8, 10, 'Benstræk med elastik', false),
  ('Calf Raise',             'bodyweight', 'reps', 2, 3,  8, 10, null, false),
  -- Thursday sheet
  ('Triceps Band Extension', 'band',       'reps', 3, 4, 12, 15, 'Triceps elastik', false),
  ('Arnold Press',           'dumbbell',   'reps', 3, 4, 12, 15, 'Start with palms facing you, rotate outward as you press up.', false),
  ('Biceps Curls',           'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Front Row',              'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Bent-over Row',          'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Chest Press',            'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  -- Friday sheet
  ('Hip Raise',              'bodyweight', 'reps', 2, 3,  8,  8, 'Or swap for Kettlebell Swing', false),
  ('Kettlebell Swing',       'kettlebell', 'reps', 2, 3,  8,  8, null, false),
  ('Renegade Row',           'dumbbell',   'reps', 2, 3,  8,  8, null, false),
  ('Leg Raise',              'bodyweight', 'reps', 2, 3,  8,  8, null, false),
  ('Knee Crunch',            'bodyweight', 'reps', 2, 3,  8,  8, null, false),
  ('Belly Swimmer',          'bodyweight', 'reps', 2, 3,  8,  8, null, false),
  ('Plank Twist',            'bodyweight', 'reps', 2, 3,  8,  8, null, false),
  -- Alternative programs
  ('Overhead Curls',         'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Triceps Kickbacks',      'dumbbell',   'reps', 3, 4, 12, 15, null, false),
  ('Reverse Flys',           'dumbbell',   'reps', 3, 3, 10, 10, null, false),
  ('Eccentric Floor Flys',   'dumbbell',   'reps', 3, 3, 10, 10, null, false),
  ('Dumbbell High Raise',    'dumbbell',   'reps', 3, 3, 10, 10, null, false),
  -- "Experimentarium" sheet: ideas to try
  ('Rotational Uppercuts',           'bodyweight', 'reps', null, null, null, null, null, true),
  ('Kettlebell Band Shoulder Press', 'kettlebell', 'reps', null, null, null, null, 'Skulderøvelse med kettlebell på elastikker', true),
  ('Rotational Squat Press',         'dumbbell',   'reps', null, null, null, null, null, true),
  ('Romanian Deadlift',              'dumbbell',   'reps', null, null, null, null, null, true),
  ('Dumbbell Good Mornings',         'dumbbell',   'reps', null, null, null, null, null, true),
  ('Farmer Carry',                   'kettlebell', 'time', null, null, null, null, null, true),
  ('Cat-Camel Stretch',              'bodyweight', 'reps', null, null, null, null, null, true),
  ('Lower Back Lift',                'bodyweight', 'reps', null, null, null, null, 'Klask røv (lændeløft)', true),
  ('Diagonal Swimmer',               'bodyweight', 'reps', null, null, null, null, 'Svømmeren (diagonalløft)', true),
  ('Band Russian Twist',             'band',       'reps', null, null, null, null, null, true),
  ('Rotational Plank Hip Dips',      'bodyweight', 'reps', null, null, null, null, null, true),
  ('Band Bird Dog',                  'band',       'reps', null, null, null, null, null, true),
  ('Shrugs',                         'dumbbell',   'reps', null, null, null, null, null, true),
  ('Y-Raises on Ball',               'ball',       'reps', null, null, null, null, null, true);

-- ---------------------------------------------------------------------------
-- Exercise -> muscle groups
-- ---------------------------------------------------------------------------

insert into public.exercise_muscle_groups (exercise_id, muscle_group)
select e.id, v.muscle_group
from (values
  ('Up-Down Plank', 'core'), ('Up-Down Plank', 'shoulders'),
  ('Push-ups', 'chest'), ('Push-ups', 'shoulders'), ('Push-ups', 'triceps'),
  ('Hammer Curls', 'biceps'),
  ('Bench Dips', 'triceps'),
  ('Concentration Curls', 'biceps'),
  ('Lateral Raises', 'shoulders'),
  ('Front Raises', 'shoulders'),
  ('Chest Flys', 'chest'),
  ('Side Plank Dips', 'core'), ('Side Plank Dips', 'obliques'),
  ('Windshield Wipers', 'core'), ('Windshield Wipers', 'obliques'),
  ('High Boat to Low Boat', 'core'), ('High Boat to Low Boat', 'obliques'),
  ('Woodchopper', 'obliques'), ('Woodchopper', 'core'),
  ('Overhead Pullover', 'back'), ('Overhead Pullover', 'chest'),
  ('Mountain Climber', 'core'),
  ('Front / Reverse Lunge', 'quads'), ('Front / Reverse Lunge', 'glutes'), ('Front / Reverse Lunge', 'hamstrings'),
  ('Lateral Squats', 'quads'), ('Lateral Squats', 'glutes'),
  ('Regular Squats', 'quads'), ('Regular Squats', 'glutes'), ('Regular Squats', 'hamstrings'),
  ('Wall Sit', 'quads'),
  ('Band Leg Extension', 'quads'), ('Band Leg Extension', 'hamstrings'),
  ('Calf Raise', 'calves'),
  ('Triceps Band Extension', 'triceps'),
  ('Arnold Press', 'shoulders'), ('Arnold Press', 'triceps'),
  ('Biceps Curls', 'biceps'),
  ('Front Row', 'shoulders'), ('Front Row', 'chest'),
  ('Bent-over Row', 'back'), ('Bent-over Row', 'biceps'),
  ('Chest Press', 'chest'), ('Chest Press', 'triceps'),
  ('Hip Raise', 'glutes'), ('Hip Raise', 'lower-back'), ('Hip Raise', 'hamstrings'),
  ('Kettlebell Swing', 'glutes'), ('Kettlebell Swing', 'hamstrings'),
  ('Renegade Row', 'back'), ('Renegade Row', 'core'),
  ('Leg Raise', 'core'),
  ('Knee Crunch', 'core'), ('Knee Crunch', 'obliques'),
  ('Belly Swimmer', 'lower-back'), ('Belly Swimmer', 'shoulders'),
  ('Plank Twist', 'core'), ('Plank Twist', 'obliques'),
  ('Overhead Curls', 'biceps'),
  ('Triceps Kickbacks', 'triceps'),
  ('Reverse Flys', 'back'), ('Reverse Flys', 'shoulders'),
  ('Eccentric Floor Flys', 'chest'),
  ('Dumbbell High Raise', 'shoulders'),
  ('Rotational Uppercuts', 'obliques'), ('Rotational Uppercuts', 'shoulders'),
  ('Kettlebell Band Shoulder Press', 'shoulders'),
  ('Rotational Squat Press', 'quads'), ('Rotational Squat Press', 'glutes'), ('Rotational Squat Press', 'shoulders'), ('Rotational Squat Press', 'obliques'),
  ('Romanian Deadlift', 'hamstrings'), ('Romanian Deadlift', 'glutes'), ('Romanian Deadlift', 'lower-back'),
  ('Dumbbell Good Mornings', 'lower-back'), ('Dumbbell Good Mornings', 'hamstrings'),
  ('Farmer Carry', 'core'), ('Farmer Carry', 'back'),
  ('Cat-Camel Stretch', 'lower-back'),
  ('Lower Back Lift', 'lower-back'), ('Lower Back Lift', 'glutes'),
  ('Diagonal Swimmer', 'lower-back'), ('Diagonal Swimmer', 'glutes'), ('Diagonal Swimmer', 'shoulders'),
  ('Band Russian Twist', 'obliques'), ('Band Russian Twist', 'core'),
  ('Rotational Plank Hip Dips', 'core'), ('Rotational Plank Hip Dips', 'obliques'),
  ('Band Bird Dog', 'core'), ('Band Bird Dog', 'lower-back'),
  ('Shrugs', 'back'),
  ('Y-Raises on Ball', 'back'), ('Y-Raises on Ball', 'shoulders')
) as v (exercise_name, muscle_group)
join public.exercises e on e.name = v.exercise_name;

-- ---------------------------------------------------------------------------
-- Programs
-- ---------------------------------------------------------------------------

insert into public.programs (name) values
  ('Arms & Chest'),
  ('Core'),
  ('Legs'),
  ('Arms & Shoulders'),
  ('Core & Lower back'),
  ('Arms (alternative)'),
  ('Chest & Shoulders (alternative)');

-- Entries copy each exercise's defaults unless a value is given here.
insert into public.program_exercises
  (program_id, exercise_id, position, is_warmup, mode,
   sets_min, sets_max, reps_min, reps_max, duration_seconds)
select
  p.id, e.id, v.position, v.is_warmup, e.mode,
  coalesce(v.sets_min, e.sets_min),
  coalesce(v.sets_max, e.sets_max),
  coalesce(v.reps_min, e.reps_min),
  coalesce(v.reps_max, e.reps_max),
  e.duration_seconds
from (values
  ('Arms & Chest', 'Up-Down Plank', 1::smallint, true, null::smallint, null::smallint, null::smallint, null::smallint),
  ('Arms & Chest', 'Push-ups', 2, false, null, null, null, null),
  ('Arms & Chest', 'Hammer Curls', 3, false, null, null, null, null),
  ('Arms & Chest', 'Bench Dips', 4, false, null, null, null, null),
  ('Arms & Chest', 'Concentration Curls', 5, false, null, null, null, null),
  ('Arms & Chest', 'Lateral Raises', 6, false, null, null, null, null),
  ('Arms & Chest', 'Front Raises', 7, false, null, null, null, null),
  ('Arms & Chest', 'Chest Flys', 8, false, null, null, null, null),

  ('Core', 'Up-Down Plank', 1, true, null, null, null, null),
  ('Core', 'Side Plank Dips', 2, false, null, null, null, null),
  ('Core', 'Windshield Wipers', 3, false, null, null, null, null),
  ('Core', 'High Boat to Low Boat', 4, false, null, null, null, null),
  ('Core', 'Woodchopper', 5, false, null, null, null, null),
  ('Core', 'Overhead Pullover', 6, false, null, null, null, null),
  ('Core', 'Mountain Climber', 7, false, null, null, null, null),

  ('Legs', 'Up-Down Plank', 1, true, null, null, null, null),
  ('Legs', 'Front / Reverse Lunge', 2, false, null, null, null, null),
  ('Legs', 'Lateral Squats', 3, false, null, null, null, null),
  ('Legs', 'Regular Squats', 4, false, null, null, null, null),
  ('Legs', 'Wall Sit', 5, false, null, null, null, null),
  ('Legs', 'Band Leg Extension', 6, false, null, null, null, null),
  ('Legs', 'Calf Raise', 7, false, null, null, null, null),

  ('Arms & Shoulders', 'Up-Down Plank', 1, true, null, null, null, null),
  ('Arms & Shoulders', 'Triceps Band Extension', 2, false, null, null, null, null),
  ('Arms & Shoulders', 'Arnold Press', 3, false, null, null, null, null),
  ('Arms & Shoulders', 'Biceps Curls', 4, false, null, null, null, null),
  ('Arms & Shoulders', 'Front Row', 5, false, null, null, null, null),
  ('Arms & Shoulders', 'Bent-over Row', 6, false, null, null, null, null),
  ('Arms & Shoulders', 'Chest Press', 7, false, null, null, null, null),

  ('Core & Lower back', 'Up-Down Plank', 1, true, null, null, null, null),
  ('Core & Lower back', 'Hip Raise', 2, false, null, null, null, null),
  ('Core & Lower back', 'Renegade Row', 3, false, null, null, null, null),
  ('Core & Lower back', 'Leg Raise', 4, false, null, null, null, null),
  ('Core & Lower back', 'Knee Crunch', 5, false, null, null, null, null),
  ('Core & Lower back', 'Belly Swimmer', 6, false, null, null, null, null),
  ('Core & Lower back', 'Plank Twist', 7, false, null, null, null, null),

  ('Arms (alternative)', 'Biceps Curls', 1, false, null, null, null, null),
  ('Arms (alternative)', 'Overhead Curls', 2, false, null, null, null, null),
  ('Arms (alternative)', 'Hammer Curls', 3, false, null, null, null, null),
  ('Arms (alternative)', 'Triceps Kickbacks', 4, false, null, null, null, null),
  ('Arms (alternative)', 'Concentration Curls', 5, false, null, null, null, null),

  ('Chest & Shoulders (alternative)', 'Reverse Flys', 1, false, null, null, null, null),
  ('Chest & Shoulders (alternative)', 'Eccentric Floor Flys', 2, false, null, null, null, null),
  ('Chest & Shoulders (alternative)', 'Arnold Press', 3, false, 3, 3, 10, 10),
  ('Chest & Shoulders (alternative)', 'Dumbbell High Raise', 4, false, null, null, null, null),
  ('Chest & Shoulders (alternative)', 'Front Row', 5, false, 3, 3, 10, 10)
) as v (program_name, exercise_name, position, is_warmup, sets_min, sets_max, reps_min, reps_max)
join public.programs p on p.name = v.program_name
join public.exercises e on e.name = v.exercise_name;

-- ---------------------------------------------------------------------------
-- Weekly schedule (06:00 Denmark time)
-- ---------------------------------------------------------------------------

insert into public.weekly_schedule (weekday, program_id, start_time)
select v.weekday, p.id, '06:00'
from (values
  (1::smallint, 'Arms & Chest'),
  (2, 'Core'),
  (3, 'Legs'),
  (4, 'Arms & Shoulders'),
  (5, 'Core & Lower back')
) as v (weekday, program_name)
join public.programs p on p.name = v.program_name;
