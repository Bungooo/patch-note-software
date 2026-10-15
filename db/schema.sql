-- Schéma de la base Neon. Idempotent : appliqué par `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS "PatchNote" (
    id          TEXT PRIMARY KEY,
    date        TIMESTAMP NOT NULL,
    intro       TEXT NOT NULL,
    author      TEXT NOT NULL,
    content     JSONB NOT NULL,              -- tableau des sections : [{ name, features, fixes, tabletVersion? }]
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Member" (
    id          SERIAL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName"  TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Logiciels proposés dans le builder. Un logo à NULL = logo Ianord par défaut.
CREATE TABLE IF NOT EXISTS "Software" (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    position        INTEGER NOT NULL DEFAULT 0,
    "logo3d"        BYTEA,
    "logo3dType"    TEXT,
    "logoFlat"      BYTEA,
    "logoFlatType"  TEXT,
    "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW()
);
