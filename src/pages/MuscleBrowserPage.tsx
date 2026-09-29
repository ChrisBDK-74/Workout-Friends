import { Link } from 'react-router-dom';
import { listExercises } from '../lib/api';
import { useCategories } from '../components/CategoriesProvider';
import { useAsync } from '../hooks/useAsync';
import { ErrorMessage, Loading } from '../components/Status';
import ExerciseViewSwitch from '../components/ExerciseViewSwitch';
import MusclePicker from '../components/MusclePicker';

export default function MuscleBrowserPage() {
  const { data, error, loading, reload } = useAsync(listExercises, []);
  const { muscleGroupName } = useCategories();

  return (
    <section className="page">
      <h1 className="display-title">Exercises</h1>
      <ExerciseViewSwitch current="muscle" />

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && (
        <MusclePicker
          exercises={data}
          resultsAction={(selected) => (
            <Link
              to={`/exercises/new?${selected.map((g) => `group=${encodeURIComponent(g)}`).join('&')}`}
              className="button button-small"
            >
              New exercise for {selected.length === 1 ? muscleGroupName(selected[0]) : 'these groups'}
            </Link>
          )}
        />
      )}
    </section>
  );
}
