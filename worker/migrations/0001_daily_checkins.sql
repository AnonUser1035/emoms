-- One row per calendar day (fixed-timezone, computed by the Worker — never
-- client-supplied), holding a single shared count. No per-user columns by
-- design: this is a pure aggregate counter, not personal history.
CREATE TABLE daily_checkins (
  day TEXT PRIMARY KEY,   -- YYYY-MM-DD in the fixed timezone
  count INTEGER NOT NULL DEFAULT 0
);
