import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { addCategory, deleteEquipmentType, deleteMuscleGroup, renameCategory } from '../lib/api';
import type { Category, CategoryKind } from '../lib/types';
import { useCategories } from '../components/CategoriesProvider';
import { ChevronLeft, PlusIcon } from '../components/Icons';

/** Add, rename and delete muscle groups and equipment types. */
export default function CategoriesPage() {
  const { muscleGroups, equipment, reload } = useCategories();
  const [notice, setNotice] = useState<string>();

  const changed = (message: string) => {
    setNotice(message);
    reload();
  };

  return (
    <section className="page page-narrow">
      <Link to="/exercises" className="back-link">
        <ChevronLeft />
        Exercises
      </Link>
      <header className="stack-tight">
        <h1 className="display-title">Categories</h1>
        <p className="muted">The muscle groups and equipment you sort exercises by.</p>
      </header>

      <p role="status" className={notice ? 'notice' : 'visually-hidden'}>
        {notice}
      </p>

      <CategorySection kind="muscle" title="Muscle groups" items={muscleGroups} onChanged={changed} />
      <CategorySection kind="equipment" title="Equipment" items={equipment} onChanged={changed} />
    </section>
  );
}

function slugify(name: string, taken: string[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'o')
      .replace(/å/g, 'a')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'category';
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

const usageText = (n: number) =>
  n === 0 ? 'Not used yet' : `${n} ${n === 1 ? 'exercise' : 'exercises'}`;

function CategorySection({
  kind,
  title,
  items,
  onChanged,
}: {
  kind: CategoryKind;
  title: string;
  items: Category[];
  onChanged: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const inputId = `add-${kind}`;

  async function add(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) return setError('Type a name first.');
    if (items.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError(`“${trimmed}” already exists.`);
    }
    setBusy(true);
    setError(undefined);
    try {
      const nextOrder = Math.max(0, ...items.map((c) => c.sortOrder)) + 1;
      await addCategory(kind, slugify(trimmed, items.map((c) => c.slug)), trimmed, nextOrder);
      setName('');
      onChanged(`Added ${trimmed}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="stack" aria-labelledby={`${kind}-heading`}>
      <h2 id={`${kind}-heading`} className="section-heading">
        {title} <span className="letter-count">{items.length}</span>
      </h2>

      <ul className="grouped-list">
        {items.map((item) => (
          <CategoryRow key={item.slug} kind={kind} item={item} all={items} onChanged={onChanged} />
        ))}
      </ul>

      <form className="add-row" onSubmit={add} noValidate>
        <label htmlFor={inputId} className="visually-hidden">
          New {kind === 'muscle' ? 'muscle group' : 'equipment type'}
        </label>
        <input
          id={inputId}
          className="input"
          placeholder={kind === 'muscle' ? 'New muscle group, e.g. Forearms' : 'New equipment, e.g. Sandbag'}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          autoComplete="off"
        />
        <button type="submit" className="button button-primary" disabled={busy}>
          <PlusIcon />
          Add
        </button>
      </form>
      {error && (
        <p id={`${inputId}-error`} className="field-error">
          {error}
        </p>
      )}
    </section>
  );
}

function CategoryRow({
  kind,
  item,
  all,
  onChanged,
}: {
  kind: CategoryKind;
  item: Category;
  all: Category[];
  onChanged: (message: string) => void;
}) {
  const [mode, setMode] = useState<'view' | 'rename' | 'delete'>('view');
  const [name, setName] = useState(item.name);
  const others = all.filter((c) => c.slug !== item.slug);
  const [moveTo, setMoveTo] = useState(others[0]?.slug ?? '');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      setMode('view');
      onChanged(message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function rename(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ');
    if (!trimmed) return setError('The name can’t be empty.');
    if (trimmed === item.name) return setMode('view');
    if (others.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError(`“${trimmed}” already exists.`);
    }
    return run(() => renameCategory(kind, item.slug, trimmed), `Renamed ${item.name} to ${trimmed}.`);
  }

  const lastEquipment = kind === 'equipment' && others.length === 0;
  const moveToName = others.find((c) => c.slug === moveTo)?.name;

  return (
    <li className="category-row">
      {mode === 'rename' ? (
        <form className="add-row" onSubmit={rename} noValidate>
          <label htmlFor={`rename-${kind}-${item.slug}`} className="visually-hidden">
            New name for {item.name}
          </label>
          <input
            id={`rename-${kind}-${item.slug}`}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setMode('view')}
            autoFocus
            autoComplete="off"
          />
          <button type="submit" className="button button-primary" disabled={busy}>
            Save
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              setName(item.name);
              setError(undefined);
              setMode('view');
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <div className="category-view">
          <span className="list-card-body">
            <span className="list-card-title">{item.name}</span>
            <span className="muted small">{usageText(item.usage)}</span>
          </span>
          <button type="button" className="link-button row-action" onClick={() => setMode('rename')}>
            Rename<span className="visually-hidden"> {item.name}</span>
          </button>
          <button type="button" className="link-button row-action row-action-danger" onClick={() => setMode('delete')}>
            Delete<span className="visually-hidden"> {item.name}</span>
          </button>
        </div>
      )}

      {mode === 'delete' && (
        <div className="confirm-box">
          {lastEquipment ? (
            <p>This is the only equipment type, and every exercise needs one. Add another type before deleting it.</p>
          ) : kind === 'muscle' ? (
            <p>
              Delete {item.name}?{' '}
              {item.usage > 0 && `It will be removed from ${usageText(item.usage)}; the exercises stay. `}
              This can’t be undone.
            </p>
          ) : (
            <>
              <p>
                Delete {item.name}? This can’t be undone.
                {item.usage === 0 && ' No exercises use it.'}
              </p>
              {item.usage > 0 && (
                <div className="field">
                  <label htmlFor={`move-${item.slug}`} className="field-label-small">
                    Move its {usageText(item.usage)} to
                  </label>
                  <select
                    id={`move-${item.slug}`}
                    className="input"
                    value={moveTo}
                    onChange={(e) => setMoveTo(e.target.value)}
                  >
                    {others.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <div className="row">
            {!lastEquipment && (
              <button
                type="button"
                className="button button-danger"
                disabled={busy}
                onClick={() =>
                  run(
                    () => (kind === 'muscle' ? deleteMuscleGroup(item.slug) : deleteEquipmentType(item.slug, moveTo || null)),
                    kind === 'equipment' && item.usage > 0
                      ? `Deleted ${item.name}. Its exercises now use ${moveToName}.`
                      : `Deleted ${item.name}.`,
                  )
                }
              >
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button type="button" className="button" onClick={() => setMode('view')} autoFocus>
              {lastEquipment ? 'OK' : 'Keep it'}
            </button>
          </div>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}
    </li>
  );
}
