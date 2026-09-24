import { Navigate, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import LoginPage from './auth/LoginPage';
import { supabaseConfigured } from './lib/supabase';
import AppLayout from './components/AppLayout';
import WeekPage from './pages/WeekPage';
import DayPage from './pages/DayPage';
import ProgramsPage from './pages/ProgramsPage';
import ProgramEditorPage from './pages/ProgramEditorPage';
import ExercisesPage from './pages/ExercisesPage';
import MuscleBrowserPage from './pages/MuscleBrowserPage';
import ExerciseEditPage from './pages/ExerciseEditPage';

// A data router (rather than <BrowserRouter>) so editors can block navigation with unsaved changes.
const router = createBrowserRouter([
  {
    element: <Gate />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <WeekPage /> },
          { path: 'day/:date', element: <DayPage /> },
          { path: 'programs', element: <ProgramsPage /> },
          { path: 'programs/:id', element: <ProgramEditorPage /> },
          { path: 'exercises', element: <ExercisesPage /> },
          { path: 'exercises/by-muscle', element: <MuscleBrowserPage /> },
          { path: 'exercises/:id', element: <ExerciseEditPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export default function App() {
  if (!supabaseConfigured) return <SetupNeeded />;
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

function Gate() {
  const { session, loading, isMember, signOut } = useAuth();

  if (loading || (session && isMember === null)) {
    return <main className="center-screen muted">Loading…</main>;
  }
  if (!session) return <LoginPage />;
  if (!isMember) {
    return (
      <main className="center-screen">
        <div className="login stack">
          <h1 className="display-title">Not on the list</h1>
          <p className="muted">
            {session.user.email} isn't a member of this app. Add it to <code>allowed_users</code> in Supabase, or sign in
            with another email.
          </p>
          <button type="button" className="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return <Outlet />;
}

function SetupNeeded() {
  return (
    <main className="center-screen">
      <div className="login stack">
        <h1 className="display-title">Almost there</h1>
        <p className="muted">
          Copy <code>.env.example</code> to <code>.env.local</code>, add your Supabase URL and anon key, then restart{' '}
          <code>npm run dev</code>.
        </p>
      </div>
    </main>
  );
}
