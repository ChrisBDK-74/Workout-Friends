import type { ReactNode } from 'react';

export function Loading() {
  return <p className="muted status">Loading…</p>;
}

export function ErrorMessage({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div role="alert" className="status error-box">
      <p>Couldn't load this: {error.message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Marks screens that exist in the navigation but aren't built yet. */
export function NotBuiltYet({ title, step, children }: { title: string; step: string; children?: ReactNode }) {
  return (
    <section className="page">
      <h1 className="display-title">{title}</h1>
      <div className="placeholder">
        <p>This screen comes in {step}.</p>
        {children}
      </div>
    </section>
  );
}
