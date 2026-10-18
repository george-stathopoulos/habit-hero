CREATE TABLE notification_preferences (
 family_id TEXT NOT NULL REFERENCES families(id), subject_id TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
 reminder_time TEXT NOT NULL DEFAULT '18:00', quiet_start TEXT NOT NULL DEFAULT '20:00',quiet_end TEXT NOT NULL DEFAULT '08:00',
 approvals INTEGER NOT NULL DEFAULT 1,love INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL,
 PRIMARY KEY(family_id,subject_id)
);
CREATE TABLE push_configuration(id TEXT PRIMARY KEY,public_key TEXT NOT NULL,private_jwk TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE push_subscriptions (
 id TEXT PRIMARY KEY, family_id TEXT NOT NULL REFERENCES families(id),subject_id TEXT NOT NULL,
 endpoint TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE INDEX idx_push_family_subject ON push_subscriptions(family_id,subject_id);
CREATE TABLE notification_deliveries (
 subscription_id TEXT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
 delivery_key TEXT NOT NULL,created_at TEXT NOT NULL,
 PRIMARY KEY(subscription_id,delivery_key)
);
