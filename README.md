# Workout Friends

A private app for Christian and Stefan to plan their shared online workouts:
an exercise library, reusable programs, and a week calendar.

Stack: Vite + React + TypeScript, Supabase (Postgres, magic-link login, row level security, realtime).

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com). Pick a region between you two (e.g. Frankfurt).
2. Open **SQL Editor** and run these files in order:
   1. `supabase/migrations/20260924000000_init.sql`: tables, access rules, realtime
   2. `supabase/seed.sql`: muscle groups, 52 exercises, 7 programs, the weekly schedule
   3. `supabase/allowed_users.sql`: **put your two real email addresses in first**
   4. `supabase/migrations/20260925000000_save_exercise.sql`: saving exercises (step 2)
   5. `supabase/migrations/20260926000000_save_program.sql`: saving programs (step 3)
   6. `supabase/migrations/20260927000000_categories_and_clear_week.sql`: editable categories, clearing weeks

   With the Supabase CLI instead: `supabase link`, then `supabase db push`, then run the seed and allowed-users files.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:5173` for now (your deployed URL later)
   - Redirect URLs: add `http://localhost:5173` and, once deployed, your production URL
4. **Authentication → Providers → Email** should be enabled (it is by default).
5. **Authentication → Sign In / Providers**: turn off **Allow new users to sign up**. Only you two have
   accounts, and the app never creates new ones. (Data is members-only via RLS anyway; this just
   keeps strangers from creating empty logins.)

### 2. Run the app

```bash
cp .env.example .env.local   # then fill in URL + anon key from Project Settings → API
npm install
npm run dev
```

Open http://localhost:5173. The first time, use "Email me a sign-in link", then set a password under Account.

### 3. Deploy to Fly.io

The app is built into a small container: Node builds it, nginx serves it (`Dockerfile`, `nginx.conf`).

1. Install flyctl and sign in: `fly auth login`
2. In `fly.toml`, set `app` to your Fly app's name. The Supabase URL and publishable key are build
   arguments there; they're baked into the app at build time, so changing them needs a new deploy.
3. `fly deploy`
4. In Supabase, **Authentication → URL Configuration**: set Site URL to `https://<your-app>.fly.dev`
   and add it to Redirect URLs (keep `http://localhost:5173` for local development).

The machine sleeps when unused and wakes on the next visit, so it costs close to nothing.

## How the data is organised

| Layer | Tables | Notes |
| --- | --- | --- |
| Library | `exercises`, `exercise_muscle_groups`, `muscle_groups`, `equipment_types` | Muscle groups and equipment are editable on the Categories screen. `is_idea` marks the "Experimentarium" exercises. Sets/reps on an exercise are only defaults. |
| Programs | `programs`, `program_exercises` | Sets, reps or time live on each program entry, so the same exercise can be 3–4 × 12–15 in one program and 3 × 10 in another. Deleting an exercise removes it from all programs. |
| Calendar | `weekly_schedule`, `session_overrides` | One program per weekday repeats every week. An override changes a single date (another program, or `program_id = null` for a rest day). |

**Times are anchored to Denmark.** `start_time` is Copenhagen wall-clock time (06:00). The app converts it
for each viewer, so after the clocks change on 25 October Christian's view shows 14:00 instead of 13:00
without anything being edited. See `src/lib/time.ts` and `src/lib/constants.ts`.

**Access.** Only emails in `allowed_users` can read or write anything; everyone else gets an empty
database even with a valid login. Add or remove people in the SQL editor.

## What works now

- Magic-link login, members-only check, sign out
- Week view (mobile: list; desktop: seven columns) with previous/next week and both local times
- Day view with the program's exercises in order
- Programs list (scheduled vs not scheduled)
- Exercise library A–Z with search, and browsing by muscle group
- Create, edit and delete exercises (muscle groups, equipment, default sets/reps or time, notes, video link, idea flag)
- Program editor: rename, drag to reorder (mouse, touch or keyboard), sets/reps/time per exercise, warm-up flag,
  add exercises by muscle group or name, choose weekdays, delete. Everything saves in one go.
- One-off calendar changes: add a program to a rest day, swap the program or start time for a single date,
  make a date a rest day, or put it back on the weekly schedule. Changed days are tagged in the week view.
- Editors ask before you leave with unsaved changes (in-app navigation, back button, closing the tab).
- Exercise library by equipment, and a Categories screen to add, rename and delete muscle groups and
  equipment types (deleting equipment moves its exercises to another type).
- Installable app (manifest, icons, service worker) with a "new version" prompt.
- Sign in with email and password (set it under Account). "Email me a sign-in link" is the backup for a
  forgotten password.
- Clear week: empty one week, or the whole weekly schedule, then build a new week from the calendar
  ("Every Monday" in the day dialog sets the weekly schedule directly).

## Next steps

1. ~~**Exercise library:** create, edit and delete~~ done
2. ~~**Program editor**~~ done
3. ~~**Calendar:** one-off changes~~ done
4. **Realtime:** subscribe to table changes so edits appear on the other person's screen straight away.
5. ~~**Installable app**~~ done

Optional: `supabase gen types typescript` to generate database types and replace the hand-written
row shapes in `src/lib/api.ts`.

## Check the imported data

The spreadsheet was cleaned up on import. Worth a quick look together:

- **Muscle groups** were mapped from the mixed Danish/English notes to the 12 tags. Some are judgement calls.
- **Names** were translated and de-duplicated. The Danish originals are in `notes` where the translation
  was loose (e.g. Triceps Band Extension = "Triceps elastik", Diagonal Swimmer = "Svømmeren").
- **Wall Sit** is a timed exercise with no duration set. Add one when you edit it.
- **"Bukser på rows"** from the Experimentarium sheet wasn't imported because it's unclear what it is.
- **"Chest Press/chest Flys"** on Thursday became Chest Press. Chest Flys exists as its own exercise.

## Project structure

```
supabase/
  migrations/…_init.sql   schema, RLS, realtime
  seed.sql                data from the spreadsheet
  allowed_users.sql       who can sign in
src/
  lib/                    Supabase client, API calls, types, time zones, formatting
  auth/                   session handling and login screen
  components/             layout (tabs / sidebar), icons, shared bits
  pages/                  Week, Day, Programs, Program editor, Exercises, Muscle browser, Exercise detail
  styles/global.css       design tokens and responsive layout
```
