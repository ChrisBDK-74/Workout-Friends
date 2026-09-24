import { Link, useLocation, useParams } from 'react-router-dom';
import { getProgram, getWeeklySchedule, listExercises } from '../lib/api';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import ProgramEditor from '../components/ProgramEditor';

/** /programs/new and /programs/:id. Pass { from } in location state to return somewhere else than /programs. */
export default function ProgramEditorPage() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const returnTo = (useLocation().state as { from?: string } | null)?.from ?? '/programs';

  const { data, error, loading, reload } = useAsync(async () => {
    const [program, schedule, exercises] = await Promise.all([
      isNew ? Promise.resolve(null) : getProgram(id),
      getWeeklySchedule(),
      listExercises(),
    ]);
    return { program, schedule, exercises };
  }, [id]);

  return (
    <section className="page page-editor">
      {(loading || error) && (
        <Link to={returnTo} className="back-link">
          <ChevronLeft />
          Back
        </Link>
      )}
      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}
      {data && !loading && (
        <ProgramEditor
          key={id}
          program={data.program}
          schedule={data.schedule}
          exercises={data.exercises}
          returnTo={returnTo}
        />
      )}
    </section>
  );
}
