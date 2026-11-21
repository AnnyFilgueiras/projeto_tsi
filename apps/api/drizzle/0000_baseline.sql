-- Baseline migration exercising the Drizzle migration pipeline in MVP-02.
-- Domain tables are introduced in later slices inside each module's internal/schema.ts (S8).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
