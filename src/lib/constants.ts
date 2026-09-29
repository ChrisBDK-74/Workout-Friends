/** Session times are stored in Stefan's time zone and converted for everyone else. */
export const ANCHOR_TIME_ZONE = 'Europe/Copenhagen';

export const PEOPLE = [
  { name: 'Stefan', timeZone: 'Europe/Copenhagen', place: 'Denmark', initial: 'S' },
  { name: 'Christian', timeZone: 'Asia/Tokyo', place: 'Japan', initial: 'C' },
] as const;
