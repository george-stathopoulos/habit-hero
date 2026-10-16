-- Extend completion tracking to support multiple occurrences in a period.
ALTER TABLE completion_submissions ADD COLUMN slot_index INTEGER NOT NULL DEFAULT 1;
DROP INDEX IF EXISTS idx_completion_once_per_day;
CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_period_slot
 ON completion_submissions(family_id,child_id,habit_id,occurrence_date,slot_index);
