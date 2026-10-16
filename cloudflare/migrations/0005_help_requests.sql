-- Parent/child help messages, isolated by family and child.
CREATE TABLE IF NOT EXISTS habit_help_requests (
 id TEXT PRIMARY KEY,
 family_id TEXT NOT NULL,
 child_id TEXT NOT NULL,
 habit_id TEXT NOT NULL,
 message TEXT NOT NULL DEFAULT 'Χρειάζομαι βοήθεια.',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','helping','try_again')),
 parent_message TEXT,
 created_at TEXT NOT NULL,
 responded_at TEXT,
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id) ON DELETE CASCADE,
 FOREIGN KEY(family_id,habit_id) REFERENCES habits(family_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_habit_help_family ON habit_help_requests(family_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_habit_help_child ON habit_help_requests(family_id,child_id,created_at);
