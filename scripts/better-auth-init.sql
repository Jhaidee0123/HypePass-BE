-- Better Auth schema bootstrap for HypePass (Better Auth 1.5 + `admin` plugin)
--
-- Better Auth owns these tables; TypeORM marks UserOrmEntity as
-- synchronize:false so it won't touch them. Run this once against a fresh
-- Postgres instance (or after dropping the BA tables) before the first
-- sign-up. Idempotent: uses CREATE TABLE IF NOT EXISTS.
--
-- Usage:
--   psql "$DATABASE_URL" -f scripts/better-auth-init.sql
--   # or
--   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME \
--     -f scripts/better-auth-init.sql

BEGIN;

CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "email" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "emailVerified" boolean NOT NULL DEFAULT false,
    "image" text,
    "role" text NOT NULL DEFAULT 'user',
    "banned" boolean,
    "banReason" text,
    "banExpires" timestamptz,
    "phoneNumber" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "token" text NOT NULL UNIQUE,
    "expiresAt" timestamptz NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "impersonatedBy" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");

CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "providerId" text NOT NULL,
    "accountId" text NOT NULL,
    "password" text,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamptz,
    "refreshTokenExpiresAt" timestamptz,
    "scope" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "account_providerId_accountId_key"
    ON "account"("providerId", "accountId");

CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expiresAt" timestamptz NOT NULL,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification"("identifier");

COMMIT;
