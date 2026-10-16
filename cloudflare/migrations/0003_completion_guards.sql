-- Prevent duplicate same-day submissions and any repeated credit for a completion.
-- The first supervised-mode iteration intentionally permits one attempt per assigned
-- habit per child per UTC day. Future frequency scheduling needs separate migrations.
CREATE UNIQUE INDEX IF NOT EXISTS idx_completion_once_per_day
  ON completion_submissions(family_id,child_id,habit_id,occurrence_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_point_credit_once_per_completion
  ON point_ledger(completion_id) WHERE completion_id IS NOT NULL;
