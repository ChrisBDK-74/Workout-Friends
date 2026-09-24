import { Link, useParams } from 'react-router-dom';
import { getExercise } from '../lib/api';
import { EQUIPMENT_LABELS, muscleGroupName } from '../lib/constants';
import { formatDose } from '../lib/format';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft } from '../components/Icons';
import { ErrorMessage, Loading, NotBuiltYet } from '../components/Status';

/** Step 2 replaces this read-only view with the edit form from the mockup. */
export default function ExerciseEditPage() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const { data, error, loading, reload } = useAsync(
    () => (isNew ? Promise.resolve(null) : getExercise(id)),
    [id],
  );

  if (isNew) return <NotBuiltYet title="New exercise" step="step 2 (exercise library)" />;

  return (
    <section className="page">
      <Link to="/exercises" className="back-link">
        <ChevronLeft />
        Exercises
      </Link>
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && (
        <>
          <h1 className="display-title">{data.name}</h1>
          <dl className="details">
            <dt>Muscle groups</dt>
            <dd>{data.muscleGroups.map(muscleGroupName).join(', ') || '–'}</dd>
            <dt>Equipment</dt>
            <dd>{EQUIPMENT_LABELS[data.equipment]}</dd>
            <dt>Default</dt>
            <dd>{formatDose(data) || '–'}</dd>
            {data.notes && (
              <>
                <dt>Notes</dt>
                <dd>{data.notes}</dd>
              </>
            )}
          </dl>
          <p className="placeholder">Editing and deleting comes in step 2.</p>
        </>
      )}
    </section>
  );
}
