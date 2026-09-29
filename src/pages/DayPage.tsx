import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getDay, getProgram } from '../lib/api';
import { formatDate, todayIso } from '../lib/time';
import { formatDose } from '../lib/format';
import { useMuscleList } from '../components/CategoriesProvider';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft, PlusIcon } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import SessionTime from '../components/SessionTime';
import SessionDialog from '../components/SessionDialog';

export default function DayPage() {
  const { date = todayIso() } = useParams();
  const locationNotice = (useLocation().state as { notice?: string } | null)?.notice;
  const [notice, setNotice] = useState(locationNotice);
  const [changing, setChanging] = useState(false);
  const muscleList = useMuscleList();

  const { data, error, loading, reload } = useAsync(async () => {
    const day = await getDay(date);
    const program = day.program ? await getProgram(day.program.id) : null;
    return { day, program };
  }, [date]);

  const day = data?.day;
  let number = 0;

  return (
    <section className="page">
      <Link to="/" className="back-link">
        <ChevronLeft />
        Week
      </Link>

      <p role="status" className={notice ? 'notice' : 'visually-hidden'}>
        {notice}
      </p>

      <p className="eyebrow">
        {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
        {date === todayIso() && ' · Today'}
      </p>

      {loading && !data && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {day?.isOverride && (
        <p className="muted small">
          Changed for this date only. Usually {day.regularProgram ? day.regularProgram.name : 'a rest day'}.
        </p>
      )}

      {data && !data.program && (
        <>
          <h1 className="display-title display-title-large">Rest day</h1>
          <div className="row">
            <button type="button" className="button button-primary" onClick={() => setChanging(true)}>
              <PlusIcon />
              Add a program
            </button>
          </div>
        </>
      )}

      {data?.program && (
        <>
          <h1 className="display-title display-title-large">{data.program.name}</h1>
          {data.day.startTime && (
            <p className="muted">
              <SessionTime date={date} time={data.day.startTime} />
            </p>
          )}
          <div className="row">
            <Link
              to={`/programs/${data.program.id}`}
              state={{ from: `/day/${date}` }}
              className="button button-dark"
            >
              Edit program
            </Link>
            <button type="button" className="button" onClick={() => setChanging(true)}>
              Change for this date
            </button>
          </div>

          <ol className="entry-list">
            {data.program.entries.map((entry) => {
              if (!entry.isWarmup) number += 1;
              return (
                <li key={entry.id} className="entry">
                  <span className={entry.isWarmup ? 'entry-marker entry-marker-warmup' : 'entry-marker'}>
                    {entry.isWarmup ? 'W' : number}
                  </span>
                  <span className="entry-body">
                    <span className="entry-name">{entry.exercise.name}</span>
                    <span className="muted small">
                      {entry.isWarmup && 'Warm-up · '}
                      {muscleList(entry.exercise.muscleGroups)}
                    </span>
                  </span>
                  <span className="entry-dose">{formatDose(entry)}</span>
                </li>
              );
            })}
          </ol>
          {data.program.entries.length === 0 && (
            <p className="placeholder">This program has no exercises yet. Use Edit program to add some.</p>
          )}
        </>
      )}

      {changing && day && (
        <SessionDialog
          day={day}
          onClose={() => setChanging(false)}
          onSaved={(message) => {
            setChanging(false);
            setNotice(message);
            reload();
          }}
        />
      )}
    </section>
  );
}
