import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMuscleList } from './CategoriesProvider';
import type { EntryDraft, EntryErrors, EntryField } from '../lib/programForm';
import { CloseIcon, GripIcon } from './Icons';

interface Props {
  entry: EntryDraft;
  number: number | null; // null for warm-ups
  errors?: EntryErrors;
  onChange: (patch: Partial<EntryDraft>) => void;
  onRemove: () => void;
}

export default function ProgramEntryRow({ entry, number, errors = {}, onChange, onRemove }: Props) {
  const muscleList = useMuscleList();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.key,
  });

  const id = (field: EntryField) => `${entry.key}-${field}`;
  const invalid = (field: EntryField) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `${id(field)}-error` : undefined,
  });

  return (
    <li
      ref={setNodeRef}
      className={isDragging ? 'entry-edit entry-edit-dragging' : 'entry-edit'}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="drag-handle"
        aria-label={`Move ${entry.name}`}
        {...attributes}
        {...listeners}
      >
        <GripIcon />
      </button>

      <div className="entry-edit-body">
        <div className="entry-edit-head">
          <span className={entry.isWarmup ? 'entry-marker entry-marker-warmup' : 'entry-marker'} aria-hidden="true">
            {entry.isWarmup ? 'W' : number}
          </span>
          <span className="entry-body">
            <span className="entry-name">{entry.name}</span>
            <span className="muted small">{muscleList(entry.muscleGroups)}</span>
          </span>
        </div>

        <div className="entry-edit-dose">
          <div className="mini-field">
            <label htmlFor={id('sets')}>Sets</label>
            <input
              id={id('sets')}
              className="input input-small"
              placeholder="3–4"
              value={entry.sets}
              onChange={(e) => onChange({ sets: e.target.value })}
              {...invalid('sets')}
            />
          </div>

          {entry.mode === 'reps' ? (
            <div className="mini-field">
              <label htmlFor={id('reps')}>Reps</label>
              <input
                id={id('reps')}
                className="input input-small"
                placeholder="12–15"
                value={entry.reps}
                onChange={(e) => onChange({ reps: e.target.value })}
                {...invalid('reps')}
              />
            </div>
          ) : (
            <div className="mini-field">
              <label htmlFor={id('seconds')}>Seconds</label>
              <input
                id={id('seconds')}
                className="input input-small"
                inputMode="numeric"
                placeholder="45"
                value={entry.seconds}
                onChange={(e) => onChange({ seconds: e.target.value })}
                {...invalid('seconds')}
              />
            </div>
          )}

          <div className="mini-field">
            <label htmlFor={`${entry.key}-mode`}>Count by</label>
            <select
              id={`${entry.key}-mode`}
              className="input input-small"
              value={entry.mode}
              onChange={(e) => onChange({ mode: e.target.value as EntryDraft['mode'] })}
            >
              <option value="reps">Reps</option>
              <option value="time">Time</option>
            </select>
          </div>
        </div>

        {(Object.keys(errors) as EntryField[]).map((field) =>
          errors[field] ? (
            <p key={field} id={`${id(field)}-error`} className="field-error">
              {field === 'sets' ? 'Sets' : field === 'reps' ? 'Reps' : 'Seconds'}: {errors[field]}
            </p>
          ) : null,
        )}

        <label className="mini-check">
          <input type="checkbox" checked={entry.isWarmup} onChange={(e) => onChange({ isWarmup: e.target.checked })} />
          Warm-up
        </label>
      </div>

      <button type="button" className="icon-button-plain" aria-label={`Remove ${entry.name}`} onClick={onRemove}>
        <CloseIcon />
      </button>
    </li>
  );
}
