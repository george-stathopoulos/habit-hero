-- Preserve rejected attempts while allowing one pending/approved attempt per slot.
DROP INDEX IF EXISTS idx_completion_period_slot;
DROP INDEX IF EXISTS idx_completion_once_per_day;
CREATE UNIQUE INDEX idx_completion_live_slot ON completion_submissions
 (family_id,child_id,habit_id,occurrence_date,slot_index) WHERE status IN ('pending','approved');
CREATE TABLE habit_occurrence_controls (
 family_id TEXT NOT NULL, child_id TEXT NOT NULL, habit_id TEXT NOT NULL,
 occurrence_date TEXT NOT NULL, slot_index INTEGER NOT NULL CHECK(slot_index BETWEEN 1 AND 5),
 deferred_until TEXT, retry_for TEXT, updated_at TEXT NOT NULL,
 PRIMARY KEY(family_id,child_id,habit_id,occurrence_date,slot_index),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 FOREIGN KEY(family_id,habit_id) REFERENCES habits(family_id,id)
);
CREATE TABLE habit_lifecycle_events (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL, child_id TEXT, habit_id TEXT NOT NULL,
 completion_id TEXT, action TEXT NOT NULL, actor_parent_id TEXT,
 detail TEXT, created_at TEXT NOT NULL,
 FOREIGN KEY(family_id,habit_id) REFERENCES habits(family_id,id)
);
CREATE INDEX idx_habit_lifecycle_family ON habit_lifecycle_events(family_id,created_at,id);
