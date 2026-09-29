import { Link } from 'react-router-dom';

type View = 'az' | 'muscle' | 'equipment';

const VIEWS: { view: View; to: string; label: string }[] = [
  { view: 'az', to: '/exercises', label: 'A–Z' },
  { view: 'muscle', to: '/exercises/by-muscle', label: 'Muscle group' },
  { view: 'equipment', to: '/exercises/by-equipment', label: 'Equipment' },
];

export default function ExerciseViewSwitch({ current }: { current: View }) {
  return (
    <div className="view-row">
      <nav aria-label="Exercise view" className="segmented segmented-3">
        {VIEWS.map((v) => (
          <Link key={v.view} to={v.to} aria-current={current === v.view ? 'page' : undefined}>
            {v.label}
          </Link>
        ))}
      </nav>
      <Link to="/exercises/categories" className="view-row-link">
        Edit categories
      </Link>
    </div>
  );
}
