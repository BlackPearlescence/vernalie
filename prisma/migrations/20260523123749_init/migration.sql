-- CreateEnum
CREATE TYPE "LifecycleType" AS ENUM ('MULTI_YEAR_PERENNIAL', 'PROPAGATION_RUNNER', 'RAPID_ANNUAL');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('IN_PRODUCTION', 'READY_TO_SHIP', 'ON_HOLD', 'CULLED');

-- CreateEnum
CREATE TYPE "InfrastructureType" AS ENUM ('HIGH_TECH_GREENHOUSE', 'GREENHOUSE', 'SHADE_HOUSE', 'HOOP_HOUSE', 'OPEN_FIELD');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('MAPPING', 'VALIDATING', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "NurseryRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- CreateTable
CREATE TABLE "Nursery" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "usdaZone" INTEGER NOT NULL,
    "zipCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Nursery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseryMember" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "authUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "NurseryRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantGenus" (
    "id" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "commonName" TEXT,
    "baseLossRate" DOUBLE PRECISION NOT NULL DEFAULT 0.08,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantGenus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantCategory" (
    "id" TEXT NOT NULL,
    "genusId" TEXT NOT NULL,
    "cultivarName" TEXT NOT NULL,
    "lifecycleType" "LifecycleType" NOT NULL DEFAULT 'MULTI_YEAR_PERENNIAL',
    "minSurvivalZone" INTEGER NOT NULL,
    "decayModifier" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "weeksToHarvest" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivingBatch" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "startingQuantity" INTEGER NOT NULL,
    "currentQuantity" INTEGER NOT NULL,
    "projectedYield" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'IN_PRODUCTION',
    "fieldLocation" TEXT NOT NULL,
    "infrastructureType" "InfrastructureType" NOT NULL,
    "manualShockFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "datePlanted" TIMESTAMP(3) NOT NULL,
    "estimatedReadyDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LivingBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractCommitment" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "externalRef" TEXT NOT NULL,
    "committedQuantity" INTEGER NOT NULL,
    "targetShipDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcelLayout" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "layoutName" TEXT NOT NULL DEFAULT 'Default',
    "speciesKey" TEXT NOT NULL,
    "cultivarKey" TEXT,
    "quantityKey" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "plantedKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcelLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "nurseryId" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'MAPPING',
    "originalFileName" TEXT NOT NULL,
    "headerSnapshot" JSONB NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Nursery_zipCode_idx" ON "Nursery"("zipCode");

-- CreateIndex
CREATE INDEX "Nursery_usdaZone_idx" ON "Nursery"("usdaZone");

-- CreateIndex
CREATE INDEX "NurseryMember_nurseryId_role_idx" ON "NurseryMember"("nurseryId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "NurseryMember_authUserId_key" ON "NurseryMember"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "PlantGenus_scientificName_key" ON "PlantGenus"("scientificName");

-- CreateIndex
CREATE INDEX "PlantGenus_scientificName_idx" ON "PlantGenus"("scientificName");

-- CreateIndex
CREATE INDEX "PlantCategory_lifecycleType_idx" ON "PlantCategory"("lifecycleType");

-- CreateIndex
CREATE INDEX "PlantCategory_minSurvivalZone_idx" ON "PlantCategory"("minSurvivalZone");

-- CreateIndex
CREATE UNIQUE INDEX "PlantCategory_genusId_cultivarName_key" ON "PlantCategory"("genusId", "cultivarName");

-- CreateIndex
CREATE INDEX "LivingBatch_nurseryId_status_idx" ON "LivingBatch"("nurseryId", "status");

-- CreateIndex
CREATE INDEX "LivingBatch_nurseryId_estimatedReadyDate_idx" ON "LivingBatch"("nurseryId", "estimatedReadyDate");

-- CreateIndex
CREATE INDEX "LivingBatch_categoryId_idx" ON "LivingBatch"("categoryId");

-- CreateIndex
CREATE INDEX "LivingBatch_fieldLocation_idx" ON "LivingBatch"("fieldLocation");

-- CreateIndex
CREATE INDEX "ContractCommitment_nurseryId_targetShipDate_idx" ON "ContractCommitment"("nurseryId", "targetShipDate");

-- CreateIndex
CREATE INDEX "ContractCommitment_batchId_idx" ON "ContractCommitment"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractCommitment_nurseryId_externalRef_batchId_key" ON "ContractCommitment"("nurseryId", "externalRef", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "ExcelLayout_nurseryId_layoutName_key" ON "ExcelLayout"("nurseryId", "layoutName");

-- CreateIndex
CREATE INDEX "ImportJob_nurseryId_status_idx" ON "ImportJob"("nurseryId", "status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- AddForeignKey
ALTER TABLE "NurseryMember" ADD CONSTRAINT "NurseryMember_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantCategory" ADD CONSTRAINT "PlantCategory_genusId_fkey" FOREIGN KEY ("genusId") REFERENCES "PlantGenus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivingBatch" ADD CONSTRAINT "LivingBatch_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivingBatch" ADD CONSTRAINT "LivingBatch_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PlantCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractCommitment" ADD CONSTRAINT "ContractCommitment_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractCommitment" ADD CONSTRAINT "ContractCommitment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LivingBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcelLayout" ADD CONSTRAINT "ExcelLayout_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_nurseryId_fkey" FOREIGN KEY ("nurseryId") REFERENCES "Nursery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
