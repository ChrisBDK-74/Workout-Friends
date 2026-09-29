import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CalendarIcon, DumbbellIcon, ListIcon } from './Icons';
import { CategoriesProvider } from './CategoriesProvider';

const NAV = [
  { to: '/', label: 'Week', icon: <CalendarIcon />, end: true, alsoActiveOn: ['/day/'] },
  { to: '/programs', label: 'Programs', icon: <ListIcon />, end: false, alsoActiveOn: [] },
  { to: '/exercises', label: 'Exercises', icon: <DumbbellIcon />, end: false, alsoActiveOn: [] },
];

/** Bottom tabs on phones, a sidebar from 960px up. */
export default function AppLayout() {
  const { signOut, session } = useAuth();
  const { pathname } = useLocation();
  // A day belongs to the week, so "Week" stays highlighted there and works as the way back.
  const navClass = (base: string, item: (typeof NAV)[number]) => ({ isActive }: { isActive: boolean }) =>
    isActive || item.alsoActiveOn.some((prefix) => pathname.startsWith(prefix)) ? `${base} active` : base;

  return (
    <div className="app">
      <aside className="sidebar">
        <span className="sidebar-title">Workout Friends</span>
        <nav aria-label="Main" className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass('sidebar-link', item)}>
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
        <CategoriesProvider>
          <Outlet />
        </CategoriesProvider>
      </main>

      <nav aria-label="Main" className="tabbar">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={navClass('tab', item)}>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
