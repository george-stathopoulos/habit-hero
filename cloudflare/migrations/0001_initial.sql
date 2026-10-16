-- Habit Hero schema v1 — parent-controlled, family-isolated relational storage.
-- IDs and dates are supplied by trusted backend code; dates are UTC ISO-8601.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS families (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS parent_users (
 id TEXT PRIMARY KEY, email_normalized TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, disabled_at TEXT,
 CHECK(length(email_normalized) BETWEEN 3 AND 254)
);
CREATE TABLE IF NOT EXISTS family_memberships (
 family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 parent_id TEXT NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('owner','parent')),
 created_at TEXT NOT NULL,
 PRIMARY KEY(family_id,parent_id)
);
CREATE INDEX IF NOT EXISTS idx_membership_parent ON family_memberships(parent_id,family_id);

CREATE TABLE IF NOT EXISTS child_profiles (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
 age_band TEXT CHECK(age_band IN ('6-8','9-11','12-14') OR age_band IS NULL),
 avatar_id TEXT, avatar_level INTEGER NOT NULL DEFAULT 1 CHECK(avatar_level >= 1),
 pin_hash TEXT, pin_attempts INTEGER NOT NULL DEFAULT 0 CHECK(pin_attempts >= 0),
 pin_locked_until TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
 UNIQUE(family_id,id)
);
CREATE INDEX IF NOT EXISTS idx_children_family ON child_profiles(family_id,deleted_at);

CREATE TABLE IF NOT EXISTS habits (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 name_el TEXT NOT NULL, name_en TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT 'general', emoji TEXT NOT NULL DEFAULT '⭐',
 points INTEGER NOT NULL DEFAULT 10 CHECK(points BETWEEN 0 AND 10000),
 verification_type TEXT NOT NULL DEFAULT 'self_reported' CHECK(verification_type IN ('self_reported','parent_verified','parent_verified_optional')),
 frequency_type TEXT NOT NULL DEFAULT 'daily' CHECK(frequency_type IN ('daily','weekly','monthly','once')),
 frequency_count INTEGER NOT NULL DEFAULT 1 CHECK(frequency_count BETWEEN 1 AND 31),
 weekly_mode TEXT NOT NULL DEFAULT 'count' CHECK(weekly_mode IN ('count','specific')),
 frequency_days_json TEXT CHECK(frequency_days_json IS NULL OR json_valid(frequency_days_json)),
 retry_delay_minutes INTEGER CHECK(retry_delay_minutes IS NULL OR retry_delay_minutes >= 0),
 description_el TEXT, why_important_el TEXT, parent_tip_el TEXT,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
 UNIQUE(family_id,id)
);
CREATE INDEX IF NOT EXISTS idx_habits_family ON habits(family_id,active,deleted_at);
CREATE TABLE IF NOT EXISTS habit_assignments (
 family_id TEXT NOT NULL, habit_id TEXT NOT NULL, child_id TEXT NOT NULL,
 assigned_at TEXT NOT NULL,
 PRIMARY KEY(family_id,habit_id,child_id),
 FOREIGN KEY(family_id,habit_id) REFERENCES habits(family_id,id) ON DELETE CASCADE,
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assignments_child ON habit_assignments(family_id,child_id);

CREATE TABLE IF NOT EXISTS completion_submissions (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL, child_id TEXT NOT NULL, habit_id TEXT NOT NULL,
 occurrence_date TEXT NOT NULL CHECK(occurrence_date GLOB '????-??-??'),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 points_awarded INTEGER NOT NULL DEFAULT 0 CHECK(points_awarded >= 0),
 submitted_at TEXT NOT NULL, reviewed_at TEXT, reviewed_by TEXT,
 idempotency_key TEXT NOT NULL,
 UNIQUE(family_id,id), UNIQUE(family_id,child_id,idempotency_key),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 FOREIGN KEY(family_id,habit_id) REFERENCES habits(family_id,id),
 FOREIGN KEY(family_id,reviewed_by) REFERENCES family_memberships(family_id,parent_id),
 CHECK((status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL AND points_awarded = 0) OR
       (status IN ('approved','rejected') AND reviewed_at IS NOT NULL AND reviewed_by IS NOT NULL)),
 CHECK(status != 'rejected' OR points_awarded = 0)
);
CREATE INDEX IF NOT EXISTS idx_completions_pending ON completion_submissions(family_id,status,submitted_at);
CREATE INDEX IF NOT EXISTS idx_completions_child ON completion_submissions(family_id,child_id,occurrence_date);

CREATE TABLE IF NOT EXISTS reward_catalog (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 name_el TEXT NOT NULL, name_en TEXT NOT NULL DEFAULT '',
 description_el TEXT, emoji TEXT NOT NULL DEFAULT '🎁',
 points_cost INTEGER NOT NULL CHECK(points_cost BETWEEN 1 AND 1000000),
 recurring INTEGER NOT NULL DEFAULT 1 CHECK(recurring IN (0,1)),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 UNIQUE(family_id,id)
);
CREATE TABLE IF NOT EXISTS reward_eligibility (
 family_id TEXT NOT NULL, reward_id TEXT NOT NULL, child_id TEXT NOT NULL,
 PRIMARY KEY(family_id,reward_id,child_id),
 FOREIGN KEY(family_id,reward_id) REFERENCES reward_catalog(family_id,id) ON DELETE CASCADE,
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reward_redemptions (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL, reward_id TEXT NOT NULL, child_id TEXT NOT NULL,
 points_spent INTEGER NOT NULL CHECK(points_spent > 0),
 status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','approved','fulfilled','rejected','cancelled')),
 requested_at TEXT NOT NULL, resolved_at TEXT, resolved_by TEXT,
 idempotency_key TEXT NOT NULL,
 UNIQUE(family_id,id), UNIQUE(family_id,child_id,idempotency_key),
 FOREIGN KEY(family_id,reward_id) REFERENCES reward_catalog(family_id,id),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 FOREIGN KEY(family_id,resolved_by) REFERENCES family_memberships(family_id,parent_id)
);
CREATE INDEX IF NOT EXISTS idx_redemptions_family ON reward_redemptions(family_id,status,requested_at);

-- Immutable authoritative accounting. Balance = SUM(delta), never trust a client balance.
CREATE TABLE IF NOT EXISTS point_ledger (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL, child_id TEXT NOT NULL,
 delta INTEGER NOT NULL CHECK(delta BETWEEN -1000000 AND 1000000 AND delta != 0),
 reason TEXT NOT NULL CHECK(reason IN ('habit_completion','reward_redemption','manual_adjustment','inactivity_penalty','reversal','love_credit')),
 completion_id TEXT, redemption_id TEXT, actor_parent_id TEXT,
 idempotency_key TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(family_id,child_id,idempotency_key),
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 FOREIGN KEY(family_id,completion_id) REFERENCES completion_submissions(family_id,id),
 FOREIGN KEY(family_id,redemption_id) REFERENCES reward_redemptions(family_id,id),
 FOREIGN KEY(family_id,actor_parent_id) REFERENCES family_memberships(family_id,parent_id)
);
CREATE INDEX IF NOT EXISTS idx_ledger_child ON point_ledger(family_id,child_id,created_at);
CREATE TRIGGER IF NOT EXISTS point_ledger_no_update BEFORE UPDATE ON point_ledger
BEGIN SELECT RAISE(ABORT,'ledger entries cannot be updated'); END;
CREATE TRIGGER IF NOT EXISTS point_ledger_no_delete BEFORE DELETE ON point_ledger
BEGIN SELECT RAISE(ABORT,'ledger entries cannot be deleted'); END;

CREATE TABLE IF NOT EXISTS auth_sessions (
 id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parent_users(id) ON DELETE CASCADE,
 child_id TEXT, family_id TEXT REFERENCES families(id) ON DELETE CASCADE,
 role TEXT NOT NULL CHECK(role IN ('parent','child')),
 token_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, expires_at TEXT NOT NULL,
 revoked_at TEXT,
 FOREIGN KEY(family_id,child_id) REFERENCES child_profiles(family_id,id),
 CHECK((role = 'parent' AND parent_id IS NOT NULL AND child_id IS NULL)
    OR (role = 'child' AND child_id IS NOT NULL AND family_id IS NOT NULL AND parent_id IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_sessions_parent ON auth_sessions(parent_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON auth_sessions(family_id,child_id,expires_at);

CREATE TABLE IF NOT EXISTS auth_challenges (
 id TEXT PRIMARY KEY, parent_id TEXT REFERENCES parent_users(id) ON DELETE CASCADE,
 email_normalized TEXT NOT NULL, challenge_hash TEXT NOT NULL UNIQUE,
 purpose TEXT NOT NULL CHECK(purpose IN ('magic_link','email_verification')),
 created_at TEXT NOT NULL, expires_at TEXT NOT NULL, consumed_at TEXT,
 attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 20)
);
CREATE INDEX IF NOT EXISTS idx_challenges_expiry ON auth_challenges(expires_at);

CREATE TABLE IF NOT EXISTS audit_events (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
 actor_parent_id TEXT, actor_child_id TEXT, event_type TEXT NOT NULL,
 subject_type TEXT, subject_id TEXT, occurred_at TEXT NOT NULL,
 metadata_json TEXT CHECK(metadata_json IS NULL OR json_valid(metadata_json)),
 FOREIGN KEY(family_id,actor_parent_id) REFERENCES family_memberships(family_id,parent_id),
 FOREIGN KEY(family_id,actor_child_id) REFERENCES child_profiles(family_id,id)
);
CREATE INDEX IF NOT EXISTS idx_audit_family ON audit_events(family_id,occurred_at);
