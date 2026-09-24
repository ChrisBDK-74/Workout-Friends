import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getExercise, getExerciseUsage } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import ExerciseForm from '../components/ExerciseForm';

/** /exercises/new (optionally ?group=core&group=obliques to preselect) and /exercises/:id */
export default function ExerciseEditPage() {
  const { id = 'new' } = useParams();
  const [params] = useSearchParams();
  const isNew = id === 'new';

  const { data, error, loading, reload } = useAsync(async () => {
    if (isNew) return { exercise: null, usage: [] };
    const [exercise, usage] = await Promise.all([getExercise(id), getExerciseUsage(id)]);
    return { exercise, usage };
  }, [id]);

  return (
    <section className="page page-narrow">
      {(loading || error) && (
        <Link to="/exercises" className="back-link">
          <ChevronLeft />
          Exercises
        </Link>
      )}
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && !loading && (
        <ExerciseForm key={id} exercise={data.exercise} usage={data.usage} initialGroups={params.getAll('group')} />
      )}
    </section>
  );
}
