import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, muscleGroupName } from '../lib/constants';
import type { Exercise } from '../lib/types';
import { SearchIcon } from './Icons';

interface Props {
  exercises: Exercise[];
  /** "split": chips beside results on desktop. "stacked": chips above results (side panel). */
  layout?: 'split' | 'stacked';
  /** Pick mode: rows become checkboxes. Leave out for browse mode (rows link to the exercise). */
  picked?: string[];
  onTogglePick?: (exerciseId: string) => void;
  alreadyAdded?: Set<string>;
  /** Extra action beside the results heading, e.g. "New exercise for Core". */
  resultsAction?: (selectedGroups: string[]) => ReactNode;
}

export default function MusclePicker({
  exercises,
  layout = 'split',
  picked = [],
  onTogglePick,
  alreadyAdded,
  resultsAction,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const pickMode = Boolean(onTogglePick);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of exercises) for (const g of e.muscleGroups) map.set(g, (map.get(g) ?? 0) + 1);
    return map;
  }, [exercises]);

  const q = query.trim().toLowerCase();
  const matches = q
    ? exercises.filter((e) => e.name.toLowerCase().includes(q))
    : exercises.filter((e) => e.muscleGroups.some((g) => selected.includes(g)));

  const toggle = (slug: string) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));

  const heading = q
    ? `${matches.length} ${matches.length === 1 ? 'match' : 'matches'} for “${query.trim()}”`
    : `${matches.length} exercises for ${selected.map(muscleGroupName).join(', ')}`;

  return (
    <div className={layout === 'split' ? 'picker picker-split' : 'picker picker-stacked'}>
      <div className="stack">
        <label className="search">
          <SearchIcon />
          <span className="visually-hidden">Search by name</span>
          <input type="search" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="chip-grid" role="group" aria-label="Muscle groups">
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.slug}
              type="button"
              className="chip"
              aria-pressed={selected.includes(g.slug)}
              onClick={() => toggle(g.slug)}
            >
              <span>{g.name}</span>
              <span className="chip-count">{counts.get(g.slug) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stack" aria-live="polite">
        {!q && selected.length === 0 ? (
          <p className="placeholder">Pick one or more muscle groups, or search by name.</p>
        ) : (
          <>
            <div className="page-header">
              <h2 className="section-title">{heading}</h2>
              {!q && resultsAction?.(selected)}
            </div>
            {matches.length === 0 && <p className="muted small">No exercises found.</p>}
            <ul className="card-list">
              {matches.map((e) => {
                const tags = (
                  <span className="list-card-body">
                    <span className="list-card-title">{e.name}</span>
                    <span className="muted small">{e.muscleGroups.map(muscleGroupName).join(', ')}</span>
                  </span>
                );

                if (!pickMode) {
                  return (
                    <li key={e.id}>
                      <Link to={`/exercises/${e.id}`} className="list-card">
                        {tags}
                        {e.isIdea && <span className="pill">Idea</span>}
                        <span className="tag">{EQUIPMENT_LABELS[e.equipment]}</span>
                      </Link>
                    </li>
                  );
                }

                if (alreadyAdded?.has(e.id)) {
                  return (
                    <li key={e.id} className="list-card list-card-disabled">
                      {tags}
                      <span className="small muted">In program</span>
                    </li>
                  );
                }

                return (
                  <li key={e.id}>
                    <label className="list-card pick-row">
                      {tags}
                      {e.isIdea && <span className="pill">Idea</span>}
                      <input
                        type="checkbox"
                        checked={picked.includes(e.id)}
                        onChange={() => onTogglePick?.(e.id)}
                        aria-label={`Add ${e.name}`}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
