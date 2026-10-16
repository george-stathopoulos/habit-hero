-- Google/OIDC identities: do not use email as an authorization identity.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS parent_identities (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL REFERENCES parent_users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL CHECK (issuer IN ('https://accounts.google.com')),
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 255),
  email_at_link TEXT,
  linked_at TEXT NOT NULL,
  last_login_at TEXT,
  UNIQUE(issuer, subject),
  UNIQUE(parent_id, issuer, subject)
);
CREATE INDEX IF NOT EXISTS idx_parent_identities_parent ON parent_identities(parent_id);
-- Short-lived, one-use OAuth flow records, containing hashes only.
CREATE TABLE IF NOT EXISTS oauth_flows (
  id TEXT PRIMARY KEY,
  state_hash TEXT NOT NULL UNIQUE,
  nonce_hash TEXT NOT NULL,
  verifier_hash TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_oauth_flows_expiry ON oauth_flows(expires_at);
