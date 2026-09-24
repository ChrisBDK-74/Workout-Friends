import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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

export default function App() {
  if (!supabaseConfigured) return <SetupNeeded />;
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
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

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<WeekPage />} />
        <Route path="day/:date" element={<DayPage />} />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="programs/:id" element={<ProgramEditorPage />} />
        <Route path="exercises" element={<ExercisesPage />} />
        <Route path="exercises/by-muscle" element={<MuscleBrowserPage />} />
        <Route path="exercises/:id" element={<ExerciseEditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
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
