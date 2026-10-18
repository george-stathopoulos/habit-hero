CREATE TABLE family_invitations (
 id TEXT PRIMARY KEY,family_id TEXT NOT NULL REFERENCES families(id),created_by TEXT NOT NULL REFERENCES parent_users(id),
 email_normalized TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,expires_at TEXT NOT NULL,consumed_at TEXT,revoked_at TEXT
);
CREATE TABLE family_erasure_authorizations (
 family_id TEXT PRIMARY KEY,created_by TEXT NOT NULL,created_at TEXT NOT NULL
);
DROP TRIGGER point_ledger_no_delete;
CREATE TRIGGER point_ledger_no_delete BEFORE DELETE ON point_ledger
 WHEN NOT EXISTS(SELECT 1 FROM family_erasure_authorizations e WHERE e.family_id=OLD.family_id)
BEGIN SELECT RAISE(ABORT,'ledger entries cannot be deleted'); END;

CREATE TABLE family_membership_revocations(family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,parent_id TEXT NOT NULL REFERENCES parent_users(id),revoked_at TEXT NOT NULL,PRIMARY KEY(family_id,parent_id));
