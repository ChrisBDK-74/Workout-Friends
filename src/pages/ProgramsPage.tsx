import { Link } from 'react-router-dom';
import { listPrograms } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { PlusIcon } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import type { ProgramSummary } from '../lib/types';

const WEEKDAY_SHORT = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProgramsPage() {
  const { data, error, loading, reload } = useAsync(listPrograms, []);
  const scheduled = (data ?? [])
    .filter((p) => p.weekdays.length > 0)
    .sort((a, b) => a.weekdays[0] - b.weekdays[0]);
  const unscheduled = (data ?? []).filter((p) => p.weekdays.length === 0);

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="display-title">Programs</h1>
        <Link to="/programs/new" className="button button-primary">
          <PlusIcon />
          New program
        </Link>
      </header>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && (
        <div className="columns">
          <ProgramGroup title="On the weekly schedule" programs={scheduled} />
          <ProgramGroup title="Not scheduled" programs={unscheduled} />
        </div>
      )}
    </section>
  );
}

function ProgramGroup({ title, programs }: { title: string; programs: ProgramSummary[] }) {
  if (programs.length === 0) return null;
  return (
    <section className="stack">
      <h2 className="section-title">{title}</h2>
      <ul className="card-list">
        {programs.map((p) => (
          <li key={p.id}>
            <Link to={`/programs/${p.id}`} className="list-card">
              <span className="list-card-body">
                <span className="list-card-title">{p.name}</span>
                <span className="muted small">{p.exerciseCount} exercises</span>
              </span>
              {p.weekdays.map((d) => (
                <span key={d} className="pill">
                  {WEEKDAY_SHORT[d]}
                </span>
              ))}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
