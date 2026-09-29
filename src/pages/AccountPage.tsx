import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import PasswordField from '../components/PasswordField';

const MIN_LENGTH = 8;

export default function AccountPage() {
  const { session, signOut } = useAuth();
  const email = session?.user.email ?? '';
  const hasPassword = session?.user.user_metadata?.has_password === true;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError('The two passwords don’t match.');

    setBusy(true);
    setError(undefined);
    const { error: updateError } = await supabase.auth.updateUser({ password, data: { has_password: true } });
    setBusy(false);

    if (updateError) {
      const code = (updateError as { code?: string }).code;
      setError(
        code === 'same_password'
          ? 'That’s already your password.'
          : code === 'weak_password'
            ? 'That password is too easy to guess. Try a longer one.'
            : code === 'reauthentication_needed'
              ? 'For safety, Supabase wants a fresh sign-in first. Sign out, sign in with an email link, and set the password straight away.'
              : updateError.message,
      );
      return;
    }
    setPassword('');
    setConfirm('');
    setSaved(true);
  }

  return (
    <section className="page page-narrow">
      <h1 className="display-title">Account</h1>
      <p className="muted">
        Signed in as <strong>{email}</strong>
      </p>

      <form className="panel stack" onSubmit={save} noValidate>
        <h2 className="section-heading">{hasPassword ? 'Change password' : 'Set a password'}</h2>
        <p className="muted small">
          {hasPassword
            ? 'Pick a new password. You’ll use it the next time you sign in.'
            : 'With a password you can sign in on any device, including the installed app on your phone, without waiting for an email.'}
        </p>

        {/* Lets password managers (like iPhone Keychain) save the password for the right email */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />

        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setError(undefined);
            setSaved(false);
          }}
          autoComplete="new-password"
          describedBy="password-hint"
        />
        <p id="password-hint" className="field-hint">
          At least {MIN_LENGTH} characters.
        </p>
        <PasswordField
          id="confirm-password"
          label="Type it again"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setError(undefined);
            setSaved(false);
          }}
          autoComplete="new-password"
        />

        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="notice">
            Password saved. Use it next time you sign in, also in the installed app.
          </p>
        )}

        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>

      <div className="danger-zone">
        <button type="button" className="button" onClick={signOut}>
          Sign out
        </button>
      </div>
    </section>
  );
}
