--- Custom migration.
-- Ensure gen_random_uuid() is available (needed for DEFAULT gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;
