import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { CalendarIcon, DumbbellIcon, ListIcon, UserIcon } from './Icons';
import { CategoriesProvider } from './CategoriesProvider';

const NAV = [
  { to: '/', label: 'Week', icon: <CalendarIcon />, end: true, alsoActiveOn: ['/day/'] },
  { to: '/programs', label: 'Programs', icon: <ListIcon />, end: false, alsoActiveOn: [] },
  { to: '/exercises', label: 'Exercises', icon: <DumbbellIcon />, end: false, alsoActiveOn: [] },
  { to: '/account', label: 'Account', icon: <UserIcon />, end: false, alsoActiveOn: [] },
];

const NUDGE_DISMISSED = 'password-nudge-dismissed';

/** Bottom tabs on phones, a sidebar from 960px up. */
export default function AppLayout() {
  const { session } = useAuth();
  const { pathname } = useLocation();
  const hasPassword = session?.user.user_metadata?.has_password === true;
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    try {
      return localStorage.getItem(NUDGE_DISMISSED) === 'yes';
    } catch {
      return false;
    }
  });
  const showNudge = !hasPassword && !nudgeDismissed && pathname !== '/account';

  function dismissNudge() {
    setNudgeDismissed(true);
    try {
      localStorage.setItem(NUDGE_DISMISSED, 'yes');
    } catch {
      // Private mode: the banner just comes back next time
    }
  }
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
        </div>
      </aside>

      <main className="main">
        {showNudge && (
          <div className="nudge" role="note">
            <span>Set a password so you can sign in on your phone without an email.</span>
            <div className="row">
              <Link to="/account" className="button button-primary button-small-solid">
                Set password
              </Link>
              <button type="button" className="link-button" onClick={dismissNudge}>
                Not now
              </button>
            </div>
          </div>
        )}
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
