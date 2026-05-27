-- Mejora 11: Device Pairing
-- Tabla para tokens de vinculación de dispositivos de estudiantes.
-- El padre genera un link desde su dashboard; el link setea la cookie
-- midsea_device_family en el dispositivo del estudiante y redirige a /student-login.

CREATE TABLE IF NOT EXISTS "DeviceLinkToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "token"     TEXT NOT NULL DEFAULT gen_random_uuid(),
  "familyId"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),

  CONSTRAINT "DeviceLinkToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeviceLinkToken_token_key" UNIQUE ("token"),
  CONSTRAINT "DeviceLinkToken_familyId_fkey"
    FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DeviceLinkToken_familyId_idx" ON "DeviceLinkToken"("familyId");
