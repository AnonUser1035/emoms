-- One row per workout run. A run is created when a workout starts
-- (completed_at NULL → renders as a "half" contribution on the heatmap) and
-- completed when it finishes. Identity is gym-whiteboard trust: a display
-- name and a client-generated device id, stored verbatim, never verified.
-- daily_checkins stays behind read-only; heatmap reads merge its historical
-- counts in as completed.
CREATE TABLE runs (
  id TEXT PRIMARY KEY,            -- UUID (server-generated on start)
  workout_slug TEXT NOT NULL,
  day TEXT NOT NULL,              -- YYYY-MM-DD in the fixed timezone, server-computed
  started_at INTEGER NOT NULL,    -- unix ms, server clock
  completed_at INTEGER,           -- NULL = still started (half state)
  athlete_name TEXT,              -- NULL = anonymous (heatmap only, no whiteboard)
  device_id TEXT,
  duration_sec INTEGER,           -- summary fields, NULL until completed
  total_reps INTEGER,
  breaks INTEGER,
  completed_all INTEGER,          -- 1 = finished the prescribed work, 0 = capped out
  notes TEXT
);

CREATE INDEX idx_runs_day ON runs (day);
CREATE INDEX idx_runs_results ON runs (workout_slug, completed_at);
