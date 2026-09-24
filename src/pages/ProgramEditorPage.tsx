import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from '../components/Icons';
import { NotBuiltYet } from '../components/Status';

export default function ProgramEditorPage() {
  const { id } = useParams();
  return (
    <>
      <div className="page page-top">
        <Link to="/programs" className="back-link">
          <ChevronLeft />
          Programs
        </Link>
      </div>
      <NotBuiltYet title={id === 'new' ? 'New program' : 'Edit program'} step="step 3 (programs)">
        <p className="muted small">
          Plan: reorder with drag and drop (saved with <code>reorderProgram</code>), edit sets and reps per
          exercise, add exercises through the muscle-group picker, and choose weekdays.
        </p>
      </NotBuiltYet>
    </>
  );
}
