-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchClaim" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNASSESSED',
    "assessment" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publisher" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'OTHER',
    "publishedAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excerpt" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResearchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimSourceLink" (
    "claimId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "stance" TEXT NOT NULL,
    "rationale" TEXT,

    CONSTRAINT "ClaimSourceLink_pkey" PRIMARY KEY ("claimId","sourceId")
);

-- CreateTable
CREATE TABLE "ClaimReviewEvent" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClaimReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Investigation_userId_updatedAt_idx" ON "Investigation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ResearchClaim_investigationId_createdAt_idx" ON "ResearchClaim"("investigationId", "createdAt");

-- CreateIndex
CREATE INDEX "ResearchSource_investigationId_createdAt_idx" ON "ResearchSource"("investigationId", "createdAt");

-- CreateIndex
CREATE INDEX "ClaimReviewEvent_claimId_reviewedAt_idx" ON "ClaimReviewEvent"("claimId", "reviewedAt");

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchClaim" ADD CONSTRAINT "ResearchClaim_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchSource" ADD CONSTRAINT "ResearchSource_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimSourceLink" ADD CONSTRAINT "ClaimSourceLink_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ResearchClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimSourceLink" ADD CONSTRAINT "ClaimSourceLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ResearchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimReviewEvent" ADD CONSTRAINT "ClaimReviewEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "ResearchClaim"("id") ON DELETE CASCADE ON UPDATE CASCADE;
