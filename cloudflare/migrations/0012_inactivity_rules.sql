CREATE TABLE inactivity_rules (
 family_id TEXT NOT NULL,child_id TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 points INTEGER NOT NULL DEFAULT 5 CHECK(points BETWEEN 1 AND 100),hours INTEGER NOT NULL DEFAULT 48 CHECK(hours IN (24,48,72,168)),
 configured_by TEXT NOT NULL,updated_at TEXT NOT NULL,checked_at TEXT NOT NULL,
 PRIMARY KEY(family_id,child_id),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 FOREIGN KEY(family_id,configured_by) REFERENCES family_memberships(family_id,parent_id)
);
