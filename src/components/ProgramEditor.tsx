import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { deleteProgram, saveProgram } from '../lib/api';
import {
  draftFromProgram,
  draftSignature,
  entryFromExercise,
  validateProgram,
  type EntryDraft,
  type ProgramDraft,
  type ProgramErrors,
} from '../lib/programForm';
import type { Exercise, Program, ScheduleSlot } from '../lib/types';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import MusclePicker from './MusclePicker';
import ProgramEntryRow from './ProgramEntryRow';
import { CloseIcon, PlusIcon } from './Icons';

const WEEKDAYS = [
  { day: 1, short: 'Mon', long: 'Monday' },
  { day: 2, short: 'Tue', long: 'Tuesday' },
  { day: 3, short: 'Wed', long: 'Wednesday' },
  { day: 4, short: 'Thu', long: 'Thursday' },
  { day: 5, short: 'Fri', long: 'Friday' },
  { day: 6, short: 'Sat', long: 'Saturday' },
  { day: 7, short: 'Sun', long: 'Sunday' },
];
const dayName = (d: number) => WEEKDAYS[d - 1].long;

interface Props {
  program: Program | null; // null = new program
  schedule: ScheduleSlot[];
  exercises: Exercise[];
  /** Where Cancel and Save go back to, e.g. the day you came from */
  returnTo: string;
}

export default function ProgramEditor({ program, schedule, exercises, returnTo }: Props) {
  const navigate = useNavigate();
  const ownDays = useMemo(
    () => schedule.filter((s) => program && s.programId === program.id).map((s) => s.weekday),
    [schedule, program],
  );
  const [draft, setDraft] = useState<ProgramDraft>(() => draftFromProgram(program, ownDays));
  const [savedSignature] = useState(() => draftSignature(draft));
  const [errors, setErrors] = useState<ProgramErrors>({ entries: {} });
  const [saveError, setSaveError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const pickerHeading = useRef<HTMLHeadingElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  const dirty = draftSignature(draft) !== savedSignature;

  useUnsavedChangesGuard(dirty && !saving && !deleting);

  // Phone: the picker is a full-screen panel. Move focus into it, Escape closes it.
  useEffect(() => {
    if (!pickerOpen) return;
    pickerHeading.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePicker();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [pickerOpen]);

  function closePicker() {
    setPickerOpen(false);
    addButton.current?.focus();
  }

  // ---------- entries ----------

  const update = (patch: Partial<ProgramDraft>) => setDraft((d) => ({ ...d, ...patch }));

  function changeEntry(key: string, patch: Partial<EntryDraft>) {
    setDraft((d) => ({ ...d, entries: d.entries.map((e) => (e.key === key ? { ...e, ...patch } : e)) }));
    setErrors((errs) => {
      if (!errs.entries[key]) return errs;
      const cleared = { ...errs.entries[key] };
      for (const field of Object.keys(patch)) delete cleared[field as keyof typeof cleared];
      return { ...errs, entries: { ...errs.entries, [key]: cleared } };
    });
  }

  const removeEntry = (key: string) => setDraft((d) => ({ ...d, entries: d.entries.filter((e) => e.key !== key) }));

  function addPicked() {
    const byId = new Map(exercises.map((e) => [e.id, e]));
    const additions = picked.map((id) => byId.get(id)).filter((e): e is Exercise => Boolean(e)).map(entryFromExercise);
    setDraft((d) => ({ ...d, entries: [...d.entries, ...additions] }));
    setPicked([]);
    if (pickerOpen) closePicker();
  }

  const alreadyAdded = useMemo(() => new Set(draft.entries.map((e) => e.exerciseId)), [draft.entries]);

  // ---------- drag and drop ----------

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setDraft((d) => {
      const from = d.entries.findIndex((e) => e.key === active.id);
      const to = d.entries.findIndex((e) => e.key === over.id);
      return { ...d, entries: arrayMove(d.entries, from, to) };
    });
  }

  const nameOf = (id: UniqueIdentifier) => draft.entries.find((e) => e.key === id)?.name ?? 'exercise';
  const positionOf = (id: UniqueIdentifier) => draft.entries.findIndex((e) => e.key === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, position ${positionOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over ? `${nameOf(active.id)} moved to position ${positionOf(over.id)}.` : `${nameOf(active.id)} is outside the list.`,
    onDragEnd: ({ active, over }) =>
      over ? `${nameOf(active.id)} dropped at position ${positionOf(over.id)}.` : `${nameOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Moving ${nameOf(active.id)} cancelled.`,
  };

  // ---------- weekdays ----------

  function toggleDay(day: number) {
    update({
      weekdays: draft.weekdays.includes(day)
        ? draft.weekdays.filter((d) => d !== day)
        : [...draft.weekdays, day].sort(),
    });
  }

  const scheduleNotes = [
    ...draft.weekdays.flatMap((day) => {
      const slot = schedule.find((s) => s.weekday === day);
      return slot && slot.programId !== program?.id
        ? [`${dayName(day)} has ${slot.programName} now. Saving moves this program there instead.`]
        : [];
    }),
    ...ownDays.filter((d) => !draft.weekdays.includes(d)).map((d) => `${dayName(d)} becomes a rest day.`),
  ];

  // ---------- save and delete ----------

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { input, errors: found } = validateProgram(draft);
    setErrors(found);
    if (!input) {
      const firstEntry = draft.entries.find((e) => found.entries[e.key]);
      const field = firstEntry && (['sets', 'reps', 'seconds'] as const).find((f) => found.entries[firstEntry.key]?.[f]);
      document.getElementById(found.name ? 'program-name' : `${firstEntry?.key}-${field}`)?.focus();
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    try {
      await saveProgram(program?.id ?? null, input);
      navigate(returnTo, { state: { notice: `Saved ${input.name}.` } });
    } catch (err) {
      setSaveError((err as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!program) return;
    setDeleting(true);
    setSaveError(undefined);
    try {
      await deleteProgram(program.id);
      navigate('/programs', { replace: true, state: { notice: `Deleted ${program.name}.` } });
    } catch (err) {
      setSaveError((err as Error).message);
      setDeleting(false);
    }
  }

  let number = 0;

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-bar">
        <Link to={returnTo} className="form-bar-cancel">
          Cancel
        </Link>
        <h1 className="form-bar-title">{program ? 'Edit program' : 'New program'}</h1>
        <button type="submit" className="button button-primary" disabled={saving || deleting}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saveError && (
        <div role="alert" className="error-box">
          <p>{saveError}</p>
        </div>
      )}

      <div className="editor-layout">
        <div className="editor-main">
          <div className="field">
            <label htmlFor="program-name" className="field-label">
              Program name
            </label>
            <input
              id="program-name"
              className="input input-title"
              value={draft.name}
              onChange={(e) => {
                update({ name: e.target.value });
                if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
              }}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'program-name-error' : undefined}
              autoComplete="off"
              autoFocus={!program}
            />
            {errors.name && (
              <p id="program-name-error" className="field-error">
                {errors.name}
              </p>
            )}
          </div>

          <section className="stack" aria-labelledby="entries-heading">
            <div className="page-header">
              <h2 id="entries-heading" className="section-title">
                Exercises ({draft.entries.length})
              </h2>
              {draft.entries.length > 1 && <span className="muted small">Drag the handle to reorder</span>}
            </div>

            {draft.entries.length === 0 ? (
              <p className="placeholder">No exercises yet. Add some from the muscle groups.</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                onDragEnd={onDragEnd}
                accessibility={{ announcements }}
              >
                <SortableContext items={draft.entries.map((e) => e.key)} strategy={verticalListSortingStrategy}>
                  <ol className="entry-edit-list">
                    {draft.entries.map((entry) => {
                      if (!entry.isWarmup) number += 1;
                      return (
                        <ProgramEntryRow
                          key={entry.key}
                          entry={entry}
                          number={entry.isWarmup ? null : number}
                          errors={errors.entries[entry.key]}
                          onChange={(patch) => changeEntry(entry.key, patch)}
                          onRemove={() => removeEntry(entry.key)}
                        />
                      );
                    })}
                  </ol>
                </SortableContext>
              </DndContext>
            )}

            <button type="button" ref={addButton} className="button button-add" onClick={() => setPickerOpen(true)}>
              <PlusIcon />
              Add exercises
            </button>
          </section>

          <fieldset className="field panel">
            <legend className="field-label">Put on the calendar</legend>
            <div className="weekday-grid">
              {WEEKDAYS.map((w) => (
                <label key={w.day} className="choice">
                  <input
                    type="checkbox"
                    checked={draft.weekdays.includes(w.day)}
                    onChange={() => toggleDay(w.day)}
                    aria-label={w.long}
                  />
                  <span>{w.short}</span>
                </label>
              ))}
            </div>
            <p className="field-hint">
              {draft.weekdays.length === 0
                ? 'Not on the calendar. It stays in your programs list to use any time.'
                : 'Repeats every week at 06:00 Denmark time.'}
            </p>
            {scheduleNotes.length > 0 && (
              <ul className="notes-list">
                {scheduleNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </fieldset>

          {program && (
            <section className="danger-zone" aria-label="Delete program">
              {confirmingDelete ? (
                <div className="confirm-box">
                  <p>
                    Delete {program.name}?{' '}
                    {ownDays.length > 0 && `${ownDays.map(dayName).join(', ')} will become rest days. `}
                    The exercises stay in your library. This can't be undone.
                  </p>
                  <div className="row">
                    <button type="button" className="button button-danger" onClick={remove} disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Delete program'}
                    </button>
                    <button type="button" className="button" onClick={() => setConfirmingDelete(false)} autoFocus>
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="button button-danger-outline"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Delete program
                </button>
              )}
            </section>
          )}
        </div>

        <aside
          className={pickerOpen ? 'editor-picker editor-picker-open' : 'editor-picker'}
          aria-labelledby="picker-heading"
        >
          <div className="editor-picker-head">
            <h2 id="picker-heading" ref={pickerHeading} tabIndex={-1} className="editor-picker-title">
              Add exercises
            </h2>
            <button type="button" className="icon-button-plain picker-close" aria-label="Close" onClick={closePicker}>
              <CloseIcon />
            </button>
          </div>

          <div className="editor-picker-body">
            <MusclePicker
              exercises={exercises}
              layout="stacked"
              picked={picked}
              alreadyAdded={alreadyAdded}
              onTogglePick={(id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
            />
          </div>

          <div className="editor-picker-foot">
            <button
              type="button"
              className="button button-primary button-block"
              disabled={picked.length === 0}
              onClick={addPicked}
            >
              {picked.length === 0
                ? 'Tick exercises to add'
                : `Add ${picked.length} ${picked.length === 1 ? 'exercise' : 'exercises'}`}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}
