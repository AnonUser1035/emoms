import type { HeatmapDay } from './api';

const HEAT_CLASSES = [
  'bg-heat-0',
  'bg-heat-1',
  'bg-heat-2',
  'bg-heat-3',
  'bg-heat-4',
] as const;

/** Diagonal split for started-but-not-completed days: literally half-filled.
 * heat-2 is the mid tone, visible against heat-0 in both themes. */
const HALF_STYLE = {
  background:
    'linear-gradient(135deg, var(--color-heat-2) 50%, var(--color-heat-0) 50%)',
} as const;

/** Fixed buckets rather than relative-to-max: keeps a single big day from
 * flattening every other day's color, and reads consistently week to week. */
function bucket(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function dayLabel(day: HeatmapDay): string {
  const parts: string[] = [];
  if (day.completed > 0) {
    parts.push(`${day.completed} workout${day.completed === 1 ? '' : 's'}`);
  }
  if (day.started > 0) {
    parts.push(`${day.started} started`);
  }
  return `${day.date}: ${parts.length > 0 ? parts.join(', ') : 'no workouts'}`;
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
  const total = days.reduce((sum, d) => sum + d.completed, 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-fg-muted">
          Everyone's EMOMs, past month
        </h2>
        <span className="text-sm text-fg-muted">{total} workouts</span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-rows-7 gap-1">
            {week.map((day, di) => {
              if (!day) {
                return <div key={di} className="h-3.5 w-3.5" aria-hidden="true" />;
              }
              // Completed runs drive the intensity scale; a day whose only
              // activity is a started (unfinished) run renders half-filled,
              // and fills in once that run completes.
              const halfOnly = day.completed === 0 && day.started > 0;
              return (
                <div
                  key={day.date}
                  title={dayLabel(day)}
                  aria-label={dayLabel(day)}
                  style={halfOnly ? HALF_STYLE : undefined}
                  className={`h-3.5 w-3.5 rounded-sm ${
                    halfOnly ? '' : HEAT_CLASSES[bucket(day.completed)]
                  }`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 self-end text-xs text-fg-muted">
        <span>Less</span>
        {HEAT_CLASSES.map((cls) => (
          <span key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
        ))}
        <span>More</span>
        <span className="ml-2">Started:</span>
        <span className="h-3 w-3 rounded-sm" style={HALF_STYLE} />
      </div>
    </section>
  );
}
