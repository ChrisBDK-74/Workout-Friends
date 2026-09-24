import { Link, useLocation, useParams } from 'react-router-dom';
import { getDay, getProgram } from '../lib/api';
import { formatDate, todayIso } from '../lib/time';
import { formatDose } from '../lib/format';
import { muscleGroupName } from '../lib/constants';
import { useAsync } from '../hooks/useAsync';
import { ChevronLeft } from '../components/Icons';
import { ErrorMessage, Loading } from '../components/Status';
import SessionTime from '../components/SessionTime';

export default function DayPage() {
  const { date = todayIso() } = useParams();
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const { data, error, loading, reload } = useAsync(async () => {
    const day = await getDay(date);
    const program = day.program ? await getProgram(day.program.id) : null;
    return { day, program };
  }, [date]);

  let number = 0;

  return (
    <section className="page">
      <Link to="/" className="back-link">
        <ChevronLeft />
        Week
      </Link>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <p className="eyebrow">
        {formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
        {date === todayIso() && ' · Today'}
      </p>

      {loading && <Loading />}
      {error && <ErrorMessage error={error} onRetry={reload} />}

      {data && !data.program && <h1 className="display-title">Rest day</h1>}

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
            {/* TODO step 4: swap the program for this date only */}
            <button type="button" className="button">
              Change program
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
                      {entry.exercise.muscleGroups.map(muscleGroupName).join(', ')}
                    </span>
                  </span>
                  <span className="entry-dose">{formatDose(entry)}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
