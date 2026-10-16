-- Child PIN unlock is scoped to an already paired child device.
ALTER TABLE auth_sessions ADD COLUMN pin_verified_at TEXT;
