-- Additive and repeatable migration for timezone-aware daily/weekly/monthly habits.
CREATE TABLE IF NOT EXISTS family_settings (
 family_id TEXT PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
 timezone TEXT NOT NULL DEFAULT 'UTC',
 updated_at TEXT NOT NULL
);
