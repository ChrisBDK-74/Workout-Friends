import { Link } from 'react-router-dom';

export default function ExerciseViewSwitch({ current }: { current: 'az' | 'muscle' }) {
  return (
    <nav aria-label="Exercise view" className="segmented">
      <Link to="/exercises" aria-current={current === 'az' ? 'page' : undefined}>
        A–Z
      </Link>
      <Link to="/exercises/by-muscle" aria-current={current === 'muscle' ? 'page' : undefined}>
        By muscle group
      </Link>
    </nav>
  );
}
