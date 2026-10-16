-- Shared-family-device authentication. A Google session remains as household anchor,
-- but access to parent APIs requires a freshly verified parent PIN.
ALTER TABLE parent_users ADD COLUMN pin_hash TEXT;
ALTER TABLE parent_users ADD COLUMN pin_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE parent_users ADD COLUMN pin_locked_until TEXT;
ALTER TABLE auth_sessions ADD COLUMN household_mode INTEGER NOT NULL DEFAULT 0;
