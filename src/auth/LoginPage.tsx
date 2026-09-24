import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function sendLink(event: FormEvent) {
    event.preventDefault();
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('sent');
    }
  }

  return (
    <main className="center-screen">
      <div className="login">
        <h1 className="display-title">Workout Friends</h1>
        {status === 'sent' ? (
          <p className="muted">
            Check <strong>{email}</strong> for a sign-in link. You can close this tab once you've opened it.
          </p>
        ) : (
          <form onSubmit={sendLink} className="stack">
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
            <button type="submit" className="button button-primary" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending link…' : 'Send sign-in link'}
            </button>
            {status === 'error' && (
              <p role="alert" className="error-text">
                Couldn't send the link: {message}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
