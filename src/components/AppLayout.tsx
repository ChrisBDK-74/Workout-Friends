import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CalendarIcon, DumbbellIcon, ListIcon } from './Icons';

const NAV = [
  { to: '/', label: 'Week', icon: <CalendarIcon />, end: true },
  { to: '/programs', label: 'Programs', icon: <ListIcon />, end: false },
  { to: '/exercises', label: 'Exercises', icon: <DumbbellIcon />, end: false },
];

/** Bottom tabs on phones, a sidebar from 960px up. */
export default function AppLayout() {
  const { signOut, session } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <span className="sidebar-title">Workout Friends</span>
        <nav aria-label="Main" className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className="sidebar-link">
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="muted small">{session?.user.email}</span>
          <button type="button" className="link-button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <nav aria-label="Main" className="tabbar">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="tab">
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
