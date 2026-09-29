import { useState, type FormEvent } from 'react';
import { clearDates, clearWeeklySchedule, resetDates } from '../lib/api';
import { addDays, formatWeekRange } from '../lib/time';
import type { CalendarDay } from '../lib/types';
import { useModalDialog } from '../hooks/useModalDialog';
import { CloseIcon } from './Icons';

type Choice = 'week' | 'schedule' | 'reset';

interface Props {
  weekStart: string;
  days: CalendarDay[];
  onClose: () => void;
  onDone: (message: string) => void;
}

/** Clears one week, or the whole weekly schedule, so you can plan a fresh one. */
export default function ClearWeekDialog({ weekStart, days, onClose, onDone }: Props) {
  const dialogRef = useModalDialog();
  const range = formatWeekRange(weekStart);
  const hasChanges = days.some((d) => d.isOverride);
  const [choice, setChoice] = useState<Choice>('week');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const options: { value: Choice; title: string; text: string; show: boolean }[] = [
    {
      value: 'week',
      title: 'Only this week',
      text: `Every day ${range} becomes a rest day. The weekly schedule stays, so other weeks are unchanged.`,
      show: true,
    },
    {
      value: 'schedule',
      title: 'The weekly schedule',
      text: 'Removes the programs from every weekday, so all weeks start empty. One-off changes from this week on are removed too. Your programs and exercises are kept.',
      show: true,
    },
    {
      value: 'reset',
      title: 'Undo this week’s changes',
      text: 'Puts every day this week back on the weekly schedule.',
      show: hasChanges,
    },
  ];

  const actions: Record<Choice, { label: string; run: () => Promise<void>; message: string }> = {
    week: {
      label: 'Clear this week',
      run: () => clearDates(days.map((d) => d.date)),
      message: `Cleared ${range}. Add programs to the days you want.`,
    },
    schedule: {
      label: 'Clear the weekly schedule',
      run: () => clearWeeklySchedule(weekStart),
      message: 'The weekly schedule is empty. Use Add on a day and choose “Every …” to build the new week.',
    },
    reset: {
      label: 'Undo changes',
      run: () => resetDates(weekStart, addDays(weekStart, 6)),
      message: `${range} is back on the weekly schedule.`,
    },
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await actions[choice].run();
      onDone(actions[choice].message);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="clear-week-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form className="sheet-form" onSubmit={submit}>
        <header className="sheet-head">
          <div>
            <h2 id="clear-week-title" className="sheet-title">
              Clear week
            </h2>
            <p className="muted small">{range}</p>
          </div>
          <button type="button" className="icon-button-plain" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="sheet-body">
          <fieldset className="field">
            <legend className="field-label">What should be cleared?</legend>
            <div className="option-list">
              {options
                .filter((o) => o.show)
                .map((o) => (
                  <label key={o.value} className="option-row option-row-tall">
                    <input
                      type="radio"
                      name="clear"
                      value={o.value}
                      checked={choice === o.value}
                      onChange={() => setChoice(o.value)}
                    />
                    <span className="list-card-body">
                      <span className="list-card-title">{o.title}</span>
                      <span className="muted small">{o.text}</span>
                    </span>
                  </label>
                ))}
            </div>
          </fieldset>

          {error && (
            <div role="alert" className="error-box">
              <p>{error}</p>
            </div>
          )}
        </div>

        <footer className="sheet-foot">
          <div className="row sheet-actions">
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={choice === 'reset' ? 'button button-primary' : 'button button-danger'}
              disabled={busy}
            >
              {busy ? 'Working…' : actions[choice].label}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
