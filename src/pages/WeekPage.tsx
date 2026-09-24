import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWeek } from '../lib/api';
import { addDays, formatDate, formatWeekRange, isoWeekNumber, startOfWeek, todayIso } from '../lib/time';
import type { CalendarDay } from '../lib/types';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft, ChevronRight, PlusIcon } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import SessionTime from '../components/SessionTime';
import SessionDialog from '../components/SessionDialog';

export default function WeekPage() {
  const today = todayIso();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const { data: days, error, loading, reload } = useAsync(() => getWeek(weekStart), [weekStart]);
  const [editing, setEditing] = useState<CalendarDay | null>(null);
  const [notice, setNotice] = useState<string>();

  function changeWeek(offset: number) {
    setNotice(undefined);
    setWeekStart(addDays(weekStart, offset));
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Week {isoWeekNumber(weekStart)}</p>
          <h1 className="display-title">{formatWeekRange(weekStart)}</h1>
        </div>
        <div className="row">
          {weekStart !== startOfWeek(today) && (
            <button type="button" className="button" onClick={() => changeWeek(startOfWeekOffset(weekStart, today))}>
              This week
            </button>
          )}
          <button type="button" className="icon-button" aria-label="Previous week" onClick={() => changeWeek(-7)}>
            <ChevronLeft />
          </button>
          <button type="button" className="icon-button" aria-label="Next week" onClick={() => changeWeek(7)}>
            <ChevronRight />
          </button>
        </div>
      </header>

      <p role="status" className={notice ? 'notice' : 'visually-hidden'}>
        {notice}
      </p>

      {loading && !days && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {days && (
        <ol
          className={loading ? "week week-loading" : "week"}
          aria-label={`Week of ${formatWeekRange(weekStart)}`}
          aria-busy={loading}
        >
          {days.map((day) => {
            const isToday = day.date === today;
            const dow = formatDate(day.date, { weekday: 'short' });
            const dateNumber = formatDate(day.date, { day: 'numeric' });
            const changed = day.isOverride && <span className="pill pill-quiet">Changed</span>;
            return (
              <li key={day.date}>
                {day.program ? (
                  <Link to={`/day/${day.date}`} className="day-card">
                    <DateBadge dow={dow} day={dateNumber} isToday={isToday} />
                    <span className="day-body">
                      <span className="day-program">{day.program.name}</span>
                      <span className="muted small">{day.program.exerciseCount} exercises</span>
                      {day.startTime && (
                        <span className="small day-time">
                          <SessionTime date={day.date} time={day.startTime} />
                        </span>
                      )}
                    </span>
                    {changed}
                  </Link>
                ) : (
                  <div className="day-card day-card-rest">
                    <DateBadge dow={dow} day={dateNumber} isToday={isToday} />
                    <span className="day-body muted">Rest day</span>
                    {changed}
                    <button
                      type="button"
                      className="button button-small"
                      aria-label={`Add a program on ${formatDate(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}`}
                      onClick={() => setEditing(day)}
                    >
                      <PlusIcon />
                      Add
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {editing && (
        <SessionDialog
          day={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            reload();
          }}
        />
      )}
    </section>
  );
}

function startOfWeekOffset(weekStart: string, today: string): number {
  const [a, b] = [weekStart, startOfWeek(today)].map((d) => Date.parse(`${d}T00:00:00Z`));
  return Math.round((b - a) / 86_400_000);
}

function DateBadge({ dow, day, isToday }: { dow: string; day: string; isToday: boolean }) {
  return (
    <span className="date-badge" aria-current={isToday ? 'date' : undefined}>
      <span className="date-dow">{dow}</span>
      <span className={isToday ? 'date-num date-num-today' : 'date-num'}>{day}</span>
    </span>
  );
}
