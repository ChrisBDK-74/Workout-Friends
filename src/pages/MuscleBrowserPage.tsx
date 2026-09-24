import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listExercises } from '../lib/api';
import { EQUIPMENT_LABELS, MUSCLE_GROUPS, muscleGroupName } from '../lib/constants';
import { useAsync } from '../hooks/useAsync';
import { ErrorMessage, Loading } from '../components/Status';
import ExerciseViewSwitch from '../components/ExerciseViewSwitch';

/**
 * Browse the library by muscle group. In step 3 the same component gets a
 * "pick" mode (checkboxes + "Add to program") used from the program editor.
 */
export default function MuscleBrowserPage() {
  const { data, error, loading, reload } = useAsync(listExercises, []);
  const [selected, setSelected] = useState<string[]>([]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of data ?? []) for (const g of e.muscleGroups) map.set(g, (map.get(g) ?? 0) + 1);
    return map;
  }, [data]);

  const matches = (data ?? []).filter((e) => e.muscleGroups.some((g) => selected.includes(g)));

  const toggle = (slug: string) =>
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));

  return (
    <section className="page">
      <h1 className="display-title">Exercises</h1>
      <ExerciseViewSwitch current="muscle" />

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && (
        <div className="split">
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

          <div className="stack">
            {selected.length === 0 ? (
              <p className="placeholder">Pick one or more muscle groups to see their exercises.</p>
            ) : (
              <>
                <h2 className="section-title">
                  {matches.length} exercises for {selected.map(muscleGroupName).join(', ')}
                </h2>
                <ul className="card-list">
                  {matches.map((e) => (
                    <li key={e.id}>
                      <Link to={`/exercises/${e.id}`} className="list-card">
                        <span className="list-card-body">
                          <span className="list-card-title">{e.name}</span>
                          <span className="muted small">{e.muscleGroups.map(muscleGroupName).join(', ')}</span>
                        </span>
                        <span className="tag">{EQUIPMENT_LABELS[e.equipment]}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
