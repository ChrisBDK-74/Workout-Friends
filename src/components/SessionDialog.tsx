import { useEffect, useRef, useState, type FormEvent } from 'react';
import { clearSessionOverride, listPrograms, setSessionOverride } from '../lib/api';
import { PEOPLE } from '../lib/constants';
import { formatDate, formatTime, zonedToInstant } from '../lib/time';
import type { CalendarDay } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import { CloseIcon } from './Icons';
import { ErrorMessage, Loading } from './Status';

const REST = 'rest';
const WEEKDAY_PLURAL = ['', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

interface Props {
  day: CalendarDay;
  onClose: () => void;
  /** Called after a change is saved, with a short message to show */
  onSaved: (message: string) => void;
}

/** Changes the program (or start time) for one date. The weekly schedule is left alone. */
export default function SessionDialog({ day, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { data: programs, error, loading, reload } = useAsync(listPrograms, []);
  const [choice, setChoice] = useState(day.program?.id ?? REST);
  const [time, setTime] = useState(day.startTime ?? day.regularStartTime ?? '06:00');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const dateLabel = formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' });
  const regularLabel = day.regularProgram ? day.regularProgram.name : 'a rest day';

  // Open as a modal on mount; give focus back to whatever opened it when done
  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus();
    };
  }, []);

  const timeIsValid = /^\d{2}:\d{2}$/.test(time);
  const otherZones = timeIsValid
    ? PEOPLE.filter((p) => p.timeZone !== 'Europe/Copenhagen').map(
        (p) => `${formatTime(zonedToInstant(day.date, time), p.timeZone)} in ${p.place}`,
      )
    : [];

  async function run(action: () => Promise<void>, message: string) {
    setSaving(true);
    setSaveError(undefined);
    try {
      await action();
      onSaved(message);
    } catch (err) {
      setSaveError((err as Error).message);
      setSaving(false);
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const programId = choice === REST ? null : choice;
    if (programId && !timeIsValid) {
      setSaveError('Enter a start time, like 06:00.');
      return;
    }
    const programName = programs?.find((p) => p.id === programId)?.name ?? 'the program';
    const sameAsRegular =
      programId === (day.regularProgram?.id ?? null) && (programId === null || time === day.regularStartTime);

    if (sameAsRegular) {
      // No need for a one-off change that says the same as the weekly schedule
      return run(() => clearSessionOverride(day.date), `${dateLabel} is back on the weekly schedule.`);
    }
    const storedTime = programId && time !== day.regularStartTime ? time : null;
    return run(
      () => setSessionOverride(day.date, programId, storedTime),
      programId ? `${dateLabel} changed to ${programName}.` : `${dateLabel} is now a rest day.`,
    );
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby="session-dialog-title"
      // Escape: let React close it by unmounting. (Not onClose: React's dev-mode double mount
      // fires a late "close" event that would shut the dialog right after it opens.)
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <form className="sheet-form" onSubmit={save}>
        <header className="sheet-head">
          <div>
            <h2 id="session-dialog-title" className="sheet-title">
              {dateLabel}
            </h2>
            <p className="muted small">Only this date changes. The weekly schedule stays the same.</p>
          </div>
          <button type="button" className="icon-button-plain" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="sheet-body">
          {loading && <Loading />}
          {error && <ErrorMessage error={error} onRetry={reload} />}

          {programs && (
            <fieldset className="field">
              <legend className="field-label">Program</legend>
              <div className="option-list">
                {programs.map((p) => (
                  <label key={p.id} className="option-row">
                    <input
                      type="radio"
                      name="program"
                      value={p.id}
                      checked={choice === p.id}
                      onChange={() => setChoice(p.id)}
                    />
                    <span className="list-card-body">
                      <span className="list-card-title">{p.name}</span>
                      <span className="muted small">{p.exerciseCount} exercises</span>
                    </span>
                    {p.weekdays.includes(day.weekday) && (
                      <span className="pill">Usual for {WEEKDAY_PLURAL[day.weekday]}</span>
                    )}
                  </label>
                ))}
                <label className="option-row">
                  <input
                    type="radio"
                    name="program"
                    value={REST}
                    checked={choice === REST}
                    onChange={() => setChoice(REST)}
                  />
                  <span className="list-card-body">
                    <span className="list-card-title">Rest day</span>
                    <span className="muted small">No session this date</span>
                  </span>
                </label>
              </div>
            </fieldset>
          )}

          {programs && choice !== REST && (
            <div className="field">
              <label htmlFor="session-time" className="field-label">
                Start time in Denmark
              </label>
              <div className="time-row">
                <input
                  id="session-time"
                  type="time"
                  step={300}
                  className="input input-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-describedby="session-time-hint"
                />
                <span id="session-time-hint" className="muted small">
                  {otherZones.join(' · ')}
                </span>
              </div>
            </div>
          )}

          {saveError && (
            <div role="alert" className="error-box">
              <p>{saveError}</p>
            </div>
          )}
        </div>

        <footer className="sheet-foot">
          {day.isOverride && (
            <button
              type="button"
              className="link-button"
              disabled={saving}
              onClick={() => run(() => clearSessionOverride(day.date), `${dateLabel} is back on the weekly schedule.`)}
            >
              Back to the weekly schedule ({regularLabel})
            </button>
          )}
          <div className="row sheet-actions">
            <button type="button" className="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={saving || !programs}>
              {saving ? 'Saving…' : 'Save for this date'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
