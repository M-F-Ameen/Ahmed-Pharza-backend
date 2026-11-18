-- Required PostgreSQL extensions.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TYPE "ProjectKind" AS ENUM ('GENERAL', 'SOFTWARE');
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'DELETED');
CREATE TYPE "RevisionState" AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED');
CREATE TYPE "PublicationState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TABLE "Role" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "roleId" UUID NOT NULL,
  "permissionKey" TEXT NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionKey")
);

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" CITEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "roleId" UUID NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RefreshSession" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "revokedAt" TIMESTAMPTZ(6),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storageKey" TEXT NOT NULL,
  "publicUrl" TEXT,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "altText" TEXT,
  "originalFilename" TEXT NOT NULL,
  "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
  "uploadedById" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Project" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "kind" "ProjectKind" NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "label" TEXT,
  "description" TEXT NOT NULL,
  "lead" TEXT,
  "overview" TEXT,
  "challenge" TEXT,
  "approach" TEXT,
  "outcome" TEXT,
  "imageAlt" TEXT NOT NULL,
  "tags" TEXT[],
  "previewUrl" TEXT,
  "githubUrl" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "visible" BOOLEAN NOT NULL DEFAULT true,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'DRAFT',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectMedia" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL,
  "mediaAssetId" UUID NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isCover" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ProjectMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentRevision" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "entityType" TEXT NOT NULL,
  "entityId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "state" "RevisionState" NOT NULL DEFAULT 'DRAFT',
  "payload" JSONB NOT NULL,
  "createdBy" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMPTZ(6),
  CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actorId" UUID,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" UUID,
  "metadata" JSONB,
  "correlationId" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "Project_kind_publicationState_visible_sortOrder_idx" ON "Project"("kind", "publicationState", "visible", "sortOrder");
CREATE UNIQUE INDEX "Project_kind_slug_key" ON "Project"("kind", "slug");
CREATE INDEX "ProjectMedia_projectId_sortOrder_idx" ON "ProjectMedia"("projectId", "sortOrder");
CREATE UNIQUE INDEX "ProjectMedia_projectId_mediaAssetId_key" ON "ProjectMedia"("projectId", "mediaAssetId");
CREATE INDEX "ContentRevision_entityType_entityId_state_idx" ON "ContentRevision"("entityType", "entityId", "state");
CREATE UNIQUE INDEX "ContentRevision_entityType_entityId_version_key" ON "ContentRevision"("entityType", "entityId", "version");
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

ALTER TABLE "RolePermission"
  ADD CONSTRAINT "RolePermission_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User"
  ADD CONSTRAINT "User_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefreshSession"
  ADD CONSTRAINT "RefreshSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectMedia"
  ADD CONSTRAINT "ProjectMedia_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMedia"
  ADD CONSTRAINT "ProjectMedia_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
