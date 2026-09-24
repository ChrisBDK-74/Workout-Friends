import { PEOPLE } from '../lib/constants';
import { formatTime, zonedToInstant } from '../lib/time';

/** Shows one session's start time for both of you, e.g. "06:00 Denmark · 13:00 Japan". */
export default function SessionTime({ date, time }: { date: string; time: string }) {
  const instant = zonedToInstant(date, time);
  return (
    <span className="session-time">
      {PEOPLE.map((p, i) => (
        <span key={p.name}>
          {i > 0 && ' · '}
          <strong>{formatTime(instant, p.timeZone)}</strong> {p.place}
        </span>
      ))}
    </span>
  );
}
