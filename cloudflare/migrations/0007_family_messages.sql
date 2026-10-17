-- Durable encouragement and optional claimable Love Credits; additive only.
CREATE TABLE IF NOT EXISTS family_messages (
 id TEXT PRIMARY KEY,
 family_id TEXT NOT NULL,
 child_id TEXT NOT NULL,
 created_by TEXT NOT NULL,
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 500),
 gift_points INTEGER NOT NULL DEFAULT 0 CHECK(gift_points BETWEEN 0 AND 100),
 request_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 read_at TEXT,
 claimed_at TEXT,
 UNIQUE(family_id,request_id),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id) ON DELETE CASCADE,
 FOREIGN KEY(family_id,created_by) REFERENCES family_memberships(family_id,parent_id)
);
CREATE INDEX IF NOT EXISTS idx_family_messages_child ON family_messages(family_id,child_id,created_at);
CREATE INDEX IF NOT EXISTS idx_family_messages_family ON family_messages(family_id,created_at);
