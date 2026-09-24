import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getWeek } from '../lib/api';
import { addDays, formatDate, formatWeekRange, isoWeekNumber, startOfWeek, todayIso } from '../lib/time';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft, ChevronRight, PlusIcon } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import SessionTime from '../components/SessionTime';

export default function WeekPage() {
  const today = todayIso();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const { data: days, error, loading, reload } = useAsync(() => getWeek(weekStart), [weekStart]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Week {isoWeekNumber(weekStart)}</p>
          <h1 className="display-title">{formatWeekRange(weekStart)}</h1>
        </div>
        <div className="row">
          <button type="button" className="icon-button" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft />
          </button>
          <button type="button" className="icon-button" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight />
          </button>
        </div>
      </header>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {days && (
        <ol className="week" aria-label={`Week of ${formatWeekRange(weekStart)}`}>
          {days.map((day) => {
            const isToday = day.date === today;
            const dow = formatDate(day.date, { weekday: 'short' });
            const dateNumber = formatDate(day.date, { day: 'numeric' });
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
                  </Link>
                ) : (
                  <div className="day-card day-card-rest">
                    <DateBadge dow={dow} day={dateNumber} isToday={isToday} />
                    <span className="day-body muted">Rest day</span>
                    {/* TODO step 4: open a program picker and save a session_override */}
                    <button type="button" className="button button-small" aria-label={`Add a program on ${dow} ${dateNumber}`}>
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
    </section>
  );
}

function DateBadge({ dow, day, isToday }: { dow: string; day: string; isToday: boolean }) {
  return (
    <span className="date-badge" aria-current={isToday ? 'date' : undefined}>
      <span className="date-dow">{dow}</span>
      <span className={isToday ? 'date-num date-num-today' : 'date-num'}>{day}</span>
    </span>
  );
}
