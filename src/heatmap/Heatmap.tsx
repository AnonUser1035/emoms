import type { HeatmapDay } from './api';

const HEAT_CLASSES = [
  'bg-heat-0',
  'bg-heat-1',
  'bg-heat-2',
  'bg-heat-3',
  'bg-heat-4',
] as const;

/** Fixed buckets rather than relative-to-max: keeps a single big day from
 * flattening every other day's color, and reads consistently week to week. */
function bucket(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function weekdayOf(date: string): number {
  // Fixed UTC midnight parse — `date` is a plain YYYY-MM-DD calendar label,
  // not a moment in time, so this only ever reads its day-of-week.
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Weeks as columns, weekdays as rows (Sun–Sat) — the familiar commit-graph layout. */
function buildWeeks(days: HeatmapDay[]): (HeatmapDay | null)[][] {
  if (days.length === 0) return [];
  const weeks: (HeatmapDay | null)[][] = [];
  let week: (HeatmapDay | null)[] = new Array(weekdayOf(days[0].date)).fill(
    null,
  );

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

interface HeatmapProps {
  days: HeatmapDay[];
}

export default function Heatmap({ days }: HeatmapProps) {
  const weeks = buildWeeks(days);
  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-fg-muted">
          Everyone's EMOMs, past month
        </h2>
        <span className="text-sm text-fg-muted">{total} check-ins</span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-1">
            {week.map((day, di) =>
              day ? (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.count} check-in${day.count === 1 ? '' : 's'}`}
                  aria-label={`${day.date}: ${day.count} check-in${day.count === 1 ? '' : 's'}`}
                  className={`h-3.5 w-3.5 rounded-sm ${HEAT_CLASSES[bucket(day.count)]}`}
                />
              ) : (
                <div key={di} className="h-3.5 w-3.5" aria-hidden="true" />
              ),
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 self-end text-xs text-fg-muted">
        <span>Less</span>
        {HEAT_CLASSES.map((cls) => (
          <span key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
