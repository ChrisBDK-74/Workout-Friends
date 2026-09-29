import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Sign in with an email that contains both a link and a one-time code.
 * The code matters for the installed app on iPhone: email links always open in Safari,
 * which doesn't share its login with the home-screen app, so you type the code here instead.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [resent, setResent] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  async function sendEmail() {
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin },
    });
    if (sendError) {
      throw new Error(
        sendError.status === 429
          ? 'Too many sign-in emails were sent recently. Wait a little and try again.'
          : sendError.message,
      );
    }
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await sendEmail();
      setStep('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    const token = code.replace(/\s/g, '');
    if (!/^\d{6,10}$/.test(token)) {
      setError('Enter the code from the email, digits only.');
      return;
    }
    setBusy(true);
    setError(undefined);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: cleanEmail, token, type: 'email' });
    if (verifyError) {
      setError('That code didn’t work. It may have expired; send a new one and use the newest email.');
      setBusy(false);
    }
    // On success the session changes and the app opens by itself
  }

  async function resend() {
    setBusy(true);
    setError(undefined);
    try {
      await sendEmail();
      setResent(true);
      setCode('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="center-screen">
      <div className="login">
        <img src="/icon-192.png" alt="" width={56} height={56} className="login-icon" />
        <h1 className="display-title">Workout Friends</h1>

        {step === 'email' ? (
          <form onSubmit={submitEmail} className="stack">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? 'Sending…' : 'Send sign-in email'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="stack">
            <p className="muted">
              We sent an email to <strong>{cleanEmail}</strong>. Type the code from it here, or tap the link in the
              email if you’re using the browser.
            </p>
            <label htmlFor="code" className="field-label">
              Code
            </label>
            <input
              id="code"
              className="input input-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={12}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(undefined);
              }}
              autoFocus
            />
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
            <div className="row login-links">
              <button type="button" className="link-button" onClick={resend} disabled={busy}>
                Send a new code
              </button>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError(undefined);
                  setResent(false);
                }}
              >
                Use a different email
              </button>
            </div>
            {resent && !error && (
              <p role="status" className="muted small">
                New email sent. Use the code from the newest one.
              </p>
            )}
          </form>
        )}

        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
