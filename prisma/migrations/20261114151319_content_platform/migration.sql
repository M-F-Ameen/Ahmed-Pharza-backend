-- CreateEnum
CREATE TYPE "NavigationPlacement" AS ENUM ('HEADER', 'FOOTER');

-- CreateEnum
CREATE TYPE "ContactSubmissionStatus" AS ENUM ('NEW', 'READ', 'REPLIED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "brand" TEXT NOT NULL,
    "defaultTitle" TEXT NOT NULL,
    "defaultDescription" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "mapEmbedUrl" TEXT,
    "logoMediaId" UUID,
    "faviconMediaId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "siteId" TEXT NOT NULL DEFAULT 'site',
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "placement" "NavigationPlacement" NOT NULL,
    "parentId" UUID,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sectionKey" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSetting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "pageKey" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PageSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lead" TEXT,
    "overview" TEXT,
    "challenge" TEXT,
    "approach" TEXT,
    "outcome" TEXT,
    "imageAlt" TEXT NOT NULL,
    "tags" TEXT[],
    "coverMediaId" UUID,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "bio" TEXT,
    "photoMediaId" UUID,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quote" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "company" TEXT,
    "avatarMediaId" UUID,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "company" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactSubmissionStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_logoMediaId_key" ON "SiteSettings"("logoMediaId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSettings_faviconMediaId_key" ON "SiteSettings"("faviconMediaId");

-- CreateIndex
CREATE INDEX "SocialLink_siteId_visible_sortOrder_idx" ON "SocialLink"("siteId", "visible", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SocialLink_siteId_platform_key" ON "SocialLink"("siteId", "platform");

-- CreateIndex
CREATE INDEX "NavigationItem_placement_parentId_visible_sortOrder_idx" ON "NavigationItem"("placement", "parentId", "visible", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_sectionKey_key" ON "HomepageSection"("sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "PageSetting_pageKey_key" ON "PageSetting"("pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_publicationState_visible_sortOrder_idx" ON "Service"("publicationState", "visible", "sortOrder");

-- CreateIndex
CREATE INDEX "TeamMember_visible_sortOrder_idx" ON "TeamMember"("visible", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_visible_sortOrder_idx" ON "Testimonial"("visible", "sortOrder");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_createdAt_idx" ON "ContactSubmission"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_faviconMediaId_fkey" FOREIGN KEY ("faviconMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SiteSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavigationItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_photoMediaId_fkey" FOREIGN KEY ("photoMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_avatarMediaId_fkey" FOREIGN KEY ("avatarMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
