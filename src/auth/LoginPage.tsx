import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import PasswordField from '../components/PasswordField';

/**
 * Email + password sign-in. Works the same in the browser and in the installed app.
 * "Email me a sign-in link" is the backup for a forgotten password (or before one is set).
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [linkSentTo, setLinkSentTo] = useState<string>();

  const cleanEmail = email.trim().toLowerCase();

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!cleanEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (signInError) {
      setError(
        signInError.status === 400
          ? 'Email or password is wrong. If you haven’t set a password yet, use the sign-in link below.'
          : signInError.message,
      );
      setBusy(false);
    }
    // On success the session changes and the app opens by itself
  }

  async function sendLink() {
    if (!cleanEmail) {
      setError('Enter your email first, then tap the link again.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
    });
    setBusy(false);
    if (sendError) {
      setError(
        sendError.status === 429
          ? 'Too many sign-in emails were sent recently. Wait an hour and try again.'
          : sendError.message,
      );
    } else {
      setLinkSentTo(cleanEmail);
    }
  }

  return (
    <main className="center-screen">
      <div className="login">
        <img src="/icon-192.png" alt="" width={56} height={56} className="login-icon" />
        <h1 className="display-title">Workout Friends</h1>

        <form onSubmit={signIn} className="stack" noValidate>
          <div className="field">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(undefined);
              }}
            />
          </div>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError(undefined);
            }}
            autoComplete="current-password"
          />
          <button type="submit" className="button button-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}

        <div className="login-backup">
          {linkSentTo ? (
            <p role="status" className="muted small">
              Sign-in link sent to <strong>{linkSentTo}</strong>. Open it in your browser, then set a new password
              under Account. After that you can sign in here, also in the installed app.
            </p>
          ) : (
            <p className="muted small">
              Forgot your password, or haven’t set one yet?{' '}
              <button type="button" className="link-button" onClick={sendLink} disabled={busy}>
                Email me a sign-in link
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
