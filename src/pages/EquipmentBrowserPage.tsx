import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listExercises } from '../lib/api';
import { useCategories } from '../components/CategoriesProvider';
import type { Equipment, Exercise } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import { PlusIcon } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import ExerciseViewSwitch from '../components/ExerciseViewSwitch';

/** The library grouped by equipment. Tap chips to show only some kinds (none selected = all). */
export default function EquipmentBrowserPage() {
  const { data, error, loading, reload } = useAsync(listExercises, []);
  const { equipment, equipmentName, muscleGroupName } = useCategories();
  const [selected, setSelected] = useState<Equipment[]>([]);

  const groups = useMemo(() => {
    const byEquipment = new Map<Equipment, Exercise[]>();
    for (const e of data ?? []) byEquipment.set(e.equipment, [...(byEquipment.get(e.equipment) ?? []), e]);
    // Only kinds that have exercises; "Other" stays hidden until something uses it
    // Category order from the Categories screen; types without exercises are left out
    return equipment
      .filter((kind) => byEquipment.has(kind.slug))
      .map((kind) => ({ kind: kind.slug, exercises: byEquipment.get(kind.slug)! }));
  }, [data, equipment]);

  const visible = selected.length === 0 ? groups : groups.filter((g) => selected.includes(g.kind));

  const toggle = (kind: Equipment) =>
    setSelected((s) => (s.includes(kind) ? s.filter((k) => k !== kind) : [...s, kind]));

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="display-title">Exercises</h1>
        <Link to="/exercises/new" className="button button-primary">
          <PlusIcon />
          New exercise
        </Link>
      </header>
      <ExerciseViewSwitch current="equipment" />

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && (
        <>
          <div className="chip-wrap" role="group" aria-label="Show equipment">
            {groups.map((g) => (
              <button
                key={g.kind}
                type="button"
                className="chip chip-round"
                aria-pressed={selected.includes(g.kind)}
                onClick={() => toggle(g.kind)}
              >
                {equipmentName(g.kind)}
                <span className="chip-count">{g.exercises.length}</span>
              </button>
            ))}
            {selected.length > 0 && (
              <button type="button" className="link-button show-all" onClick={() => setSelected([])}>
                Show all
              </button>
            )}
          </div>

          <div className="letter-sections">
            {visible.map((g) => (
              <section key={g.kind} className="stack-tight" aria-labelledby={`equipment-${g.kind}`}>
                <h2 id={`equipment-${g.kind}`} className="letter">
                  {equipmentName(g.kind)} <span className="letter-count">{g.exercises.length}</span>
                </h2>
                <ul className="grouped-list">
                  {g.exercises.map((e) => (
                    <li key={e.id}>
                      <Link to={`/exercises/${e.id}`} className="grouped-row">
                        <span className="list-card-body">
                          <span className="list-card-title">{e.name}</span>
                          <span className="muted small">{e.muscleGroups.map(muscleGroupName).join(', ')}</span>
                        </span>
                        {e.isIdea && <span className="pill">Idea</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
