import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listExercises } from '../lib/api';
import { EQUIPMENT_LABELS, muscleGroupName } from '../lib/constants';
import { useAsync } from '../hooks/useAsync';
import { PlusIcon, SearchIcon } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import ExerciseViewSwitch from '../components/ExerciseViewSwitch';

export default function ExercisesPage() {
  const { data, error, loading, reload } = useAsync(listExercises, []);
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (data ?? []).filter((e) => e.name.toLowerCase().includes(q));
    const byLetter = new Map<string, typeof matches>();
    for (const exercise of matches) {
      const letter = exercise.name[0].toUpperCase();
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), exercise]);
    }
    return [...byLetter.entries()];
  }, [data, query]);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="display-title">Exercises</h1>
        <Link to="/exercises/new" className="button button-primary">
          <PlusIcon />
          New exercise
        </Link>
      </header>

      <label className="search">
        <SearchIcon />
        <span className="visually-hidden">Search exercises</span>
        <input type="search" placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ExerciseViewSwitch current="az" />

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && sections.length === 0 && <p className="muted status">No exercises match “{query}”.</p>}

      <div className="letter-sections">
        {sections.map(([letter, exercises]) => (
          <section key={letter} className="stack-tight">
            <h2 className="letter">{letter}</h2>
            <ul className="grouped-list">
              {exercises.map((e) => (
                <li key={e.id}>
                  <Link to={`/exercises/${e.id}`} className="grouped-row">
                    <span className="list-card-body">
                      <span className="list-card-title">{e.name}</span>
                      <span className="muted small">{e.muscleGroups.map(muscleGroupName).join(', ')}</span>
                    </span>
                    {e.isIdea && <span className="pill">Idea</span>}
                    <span className="tag">{EQUIPMENT_LABELS[e.equipment]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
