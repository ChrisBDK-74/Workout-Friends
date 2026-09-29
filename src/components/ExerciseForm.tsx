import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteExercise, saveExercise } from '../lib/api';
import { useCategories } from './CategoriesProvider';
import {
  validateExercise,
  valuesFromExercise,
  type ExerciseFormErrors,
  type ExerciseFormField,
  type ExerciseFormValues,
} from '../lib/exerciseForm';
import type { Exercise } from '../lib/types';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

interface Props {
  exercise: Exercise | null; // null = new exercise
  usage: { id: string; name: string }[];
  initialGroups?: string[];
}

const FIELD_ORDER: ExerciseFormField[] = ['name', 'sets', 'reps', 'seconds', 'videoUrl'];

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export default function ExerciseForm({ exercise, usage, initialGroups = [] }: Props) {
  const navigate = useNavigate();
  const { muscleGroups, equipment, reload: reloadCategories } = useCategories();
  const [values, setValues] = useState<ExerciseFormValues>(() => {
    const v = valuesFromExercise(exercise);
    // New exercise: start on bodyweight if it still exists, otherwise the first equipment type
    const startEquipment = equipment.some((e) => e.slug === v.equipment) ? v.equipment : (equipment[0]?.slug ?? v.equipment);
    return exercise ? v : { ...v, equipment: startEquipment, muscleGroups: initialGroups };
  });
  const [initialValues] = useState(() => JSON.stringify(values));
  const [errors, setErrors] = useState<ExerciseFormErrors>({});
  const [saveError, setSaveError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useUnsavedChangesGuard(JSON.stringify(values) !== initialValues && !saving && !deleting);

  function set<K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function toggleGroup(slug: string) {
    set(
      'muscleGroups',
      values.muscleGroups.includes(slug)
        ? values.muscleGroups.filter((g) => g !== slug)
        : [...values.muscleGroups, slug],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { input, errors: found } = validateExercise(values);
    setErrors(found);
    if (!input) {
      const first = FIELD_ORDER.find((f) => found[f]);
      if (first) document.getElementById(`ex-${first}`)?.focus();
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    try {
      await saveExercise(exercise?.id ?? null, input);
      reloadCategories(); // usage counts on the Categories screen
      navigate('/exercises', { state: { notice: `Saved ${input.name}.` } });
    } catch (err) {
      setSaveError((err as Error).message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!exercise) return;
    setDeleting(true);
    setSaveError(undefined);
    try {
      await deleteExercise(exercise.id);
      reloadCategories();
      navigate('/exercises', { replace: true, state: { notice: `Deleted ${exercise.name}.` } });
    } catch (err) {
      setSaveError((err as Error).message);
      setDeleting(false);
    }
  }

  const fieldProps = (field: ExerciseFormField) => ({
    id: `ex-${field}`,
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `ex-${field}-error` : undefined,
  });

  const fieldError = (field: ExerciseFormField) =>
    errors[field] ? (
      <p id={`ex-${field}-error`} className="field-error">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-bar">
        <Link to="/exercises" className="form-bar-cancel">
          Cancel
        </Link>
        <h1 className="form-bar-title">{exercise ? 'Edit exercise' : 'New exercise'}</h1>
        <button type="submit" className="button button-primary" disabled={saving || deleting}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saveError && (
        <div role="alert" className="error-box">
          <p>{saveError}</p>
        </div>
      )}

      <div className="field">
        <label htmlFor="ex-name" className="field-label">
          Name
        </label>
        <input
          {...fieldProps('name')}
          className="input input-large"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          autoComplete="off"
          autoFocus={!exercise}
        />
        {fieldError('name')}
      </div>

      <fieldset className="field">
        <legend className="field-label">Muscle groups</legend>
        <div className="chip-wrap">
          {muscleGroups.map((g) => (
            <button
              key={g.slug}
              type="button"
              className="chip chip-round"
              aria-pressed={values.muscleGroups.includes(g.slug)}
              onClick={() => toggleGroup(g.slug)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field-label">Equipment</legend>
        <div className="choice-group">
          {equipment.map((item) => (
            <label key={item.slug} className="choice">
              <input
                type="radio"
                name="equipment"
                value={item.slug}
                checked={values.equipment === item.slug}
                onChange={() => set('equipment', item.slug)}
              />
              <span>{item.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="field panel">
        <legend className="field-label">Default when added to a program</legend>
        <div className="choice-group choice-group-segmented">
          <label className="choice">
            <input type="radio" name="mode" checked={values.mode === 'reps'} onChange={() => set('mode', 'reps')} />
            <span>Reps</span>
          </label>
          <label className="choice">
            <input type="radio" name="mode" checked={values.mode === 'time'} onChange={() => set('mode', 'time')} />
            <span>Time</span>
          </label>
        </div>

        <div className="field-pair">
          <div className="field">
            <label htmlFor="ex-sets" className="field-label-small">
              Sets
            </label>
            <input
              {...fieldProps('sets')}
              className="input"
              inputMode="text"
              placeholder="3–4"
              value={values.sets}
              onChange={(e) => set('sets', e.target.value)}
            />
            {fieldError('sets')}
          </div>

          {values.mode === 'reps' ? (
            <div className="field">
              <label htmlFor="ex-reps" className="field-label-small">
                Reps
              </label>
              <input
                {...fieldProps('reps')}
                className="input"
                inputMode="text"
                placeholder="12–15"
                value={values.reps}
                onChange={(e) => set('reps', e.target.value)}
              />
              {fieldError('reps')}
            </div>
          ) : (
            <div className="field">
              <label htmlFor="ex-seconds" className="field-label-small">
                Seconds per set
              </label>
              <input
                {...fieldProps('seconds')}
                className="input"
                inputMode="numeric"
                placeholder="45"
                value={values.seconds}
                onChange={(e) => set('seconds', e.target.value)}
              />
              {fieldError('seconds')}
            </div>
          )}
        </div>
        <p className="field-hint">A single number or a range. Each program can still use its own numbers.</p>
      </fieldset>

      <div className="field">
        <label htmlFor="ex-notes" className="field-label">
          Notes
        </label>
        <textarea
          id="ex-notes"
          className="input textarea"
          rows={3}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="ex-videoUrl" className="field-label">
          Video link (optional)
        </label>
        <input
          {...fieldProps('videoUrl')}
          type="url"
          className="input"
          placeholder="https://"
          value={values.videoUrl}
          onChange={(e) => set('videoUrl', e.target.value)}
        />
        {fieldError('videoUrl')}
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={values.isIdea} onChange={(e) => set('isIdea', e.target.checked)} />
        <span>
          <span className="checkbox-label">Just an idea for now</span>
          <span className="field-hint">Shows an Idea tag in the library, so you can find it later.</span>
        </span>
      </label>

      {exercise && (
        <section className="danger-zone" aria-label="Delete exercise">
          <p className="muted">
            {usage.length > 0 ? (
              <>
                Used in <strong>{listNames(usage.map((u) => u.name))}</strong>.
              </>
            ) : (
              'Not used in any program.'
            )}
          </p>

          {confirmingDelete ? (
            <div className="confirm-box">
              <p>
                Delete {exercise.name}?{' '}
                {usage.length > 0 &&
                  `It will also be removed from ${usage.length === 1 ? 'that program' : `those ${usage.length} programs`}. `}
                This can't be undone.
              </p>
              <div className="row">
                <button type="button" className="button button-danger" onClick={remove} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete exercise'}
                </button>
                <button type="button" className="button" onClick={() => setConfirmingDelete(false)} autoFocus>
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="button button-danger-outline" onClick={() => setConfirmingDelete(true)}>
              Delete exercise
            </button>
          )}
        </section>
      )}
    </form>
  );
}
