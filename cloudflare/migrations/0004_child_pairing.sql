-- Pairing is parent-authorized, one time, child-specific, and short lived.
-- Only SHA-256 hashes of cryptographically random pairing tokens are persisted.
CREATE TABLE IF NOT EXISTS child_device_pairings (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id) ON DELETE CASCADE,
  FOREIGN KEY(family_id,created_by) REFERENCES family_memberships(family_id,parent_id)
);
CREATE INDEX IF NOT EXISTS idx_pairings_family ON child_device_pairings(family_id,child_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_child_session_revocation ON auth_sessions(family_id,child_id,role,revoked_at);
