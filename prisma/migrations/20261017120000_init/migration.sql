-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'PARENTAL_LEAVE', 'ENDED');

-- CreateEnum
CREATE TYPE "RequirementKind" AS ENUM ('ALL', 'UNIT', 'POSITION');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('PLANNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Employee" (
    "id" VARCHAR(32) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(150),
    "unitKey" VARCHAR(150),
    "position" VARCHAR(150) NOT NULL,
    "positionKey" VARCHAR(150) NOT NULL,
    "startedAt" DATE NOT NULL,
    "endedAt" DATE,
    "status" "EmploymentStatus" NOT NULL,
    "managerId" VARCHAR(32),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Employee_employment_dates_check"
        CHECK ("endedAt" IS NULL OR "endedAt" >= "startedAt")
);

-- CreateTable
CREATE TABLE "Training" (
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "validityMonths" INTEGER,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("code"),
    CONSTRAINT "Training_validity_months_check"
        CHECK ("validityMonths" IS NULL OR "validityMonths" >= 0)
);

-- CreateTable
CREATE TABLE "TrainingRequirement" (
    "id" SERIAL NOT NULL,
    "trainingCode" VARCHAR(32) NOT NULL,
    "kind" "RequirementKind" NOT NULL,
    "value" VARCHAR(150),
    "normalizedKey" VARCHAR(150),

    CONSTRAINT "TrainingRequirement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TrainingRequirement_value_check" CHECK (
        ("kind" = 'ALL' AND "value" IS NULL AND "normalizedKey" IS NULL)
        OR
        ("kind" IN ('UNIT', 'POSITION') AND "value" IS NOT NULL AND "normalizedKey" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "TrainingCompletion" (
    "id" SERIAL NOT NULL,
    "sourceId" VARCHAR(50) NOT NULL,
    "employeeId" VARCHAR(32) NOT NULL,
    "trainingCode" VARCHAR(32) NOT NULL,
    "completedAt" DATE NOT NULL,
    "recordedValidUntil" DATE,
    "calculatedValidUntil" DATE,

    CONSTRAINT "TrainingCompletion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TrainingCompletion_recorded_dates_check"
        CHECK ("recordedValidUntil" IS NULL OR "recordedValidUntil" >= "completedAt"),
    CONSTRAINT "TrainingCompletion_calculated_dates_check"
        CHECK ("calculatedValidUntil" IS NULL OR "calculatedValidUntil" >= "completedAt")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" VARCHAR(32) NOT NULL,
    "trainingCode" VARCHAR(32) NOT NULL,
    "date" DATE NOT NULL,
    "timeRange" VARCHAR(32) NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "occupied" INTEGER NOT NULL,
    "status" "TrainingSessionStatus" NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TrainingSession_capacity_check" CHECK ("capacity" >= 0),
    CONSTRAINT "TrainingSession_occupied_check" CHECK ("occupied" >= 0)
);

-- CreateIndex
CREATE INDEX "Employee_status_unitKey_idx" ON "Employee"("status", "unitKey");

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- CreateIndex
CREATE INDEX "TrainingRequirement_kind_normalizedKey_idx" ON "TrainingRequirement"("kind", "normalizedKey");

-- CreateIndex
CREATE INDEX "TrainingRequirement_trainingCode_idx" ON "TrainingRequirement"("trainingCode");

-- CreateIndex
CREATE INDEX "TrainingCompletion_employeeId_trainingCode_completedAt_idx" ON "TrainingCompletion"("employeeId", "trainingCode", "completedAt");

-- CreateIndex
CREATE INDEX "TrainingCompletion_trainingCode_recordedValidUntil_idx" ON "TrainingCompletion"("trainingCode", "recordedValidUntil");

-- CreateIndex
CREATE INDEX "TrainingCompletion_sourceId_idx" ON "TrainingCompletion"("sourceId");

-- CreateIndex
CREATE INDEX "TrainingSession_status_date_idx" ON "TrainingSession"("status", "date");

-- CreateIndex
CREATE INDEX "TrainingSession_trainingCode_date_idx" ON "TrainingSession"("trainingCode", "date");

-- AddForeignKey
ALTER TABLE "Employee"
    ADD CONSTRAINT "Employee_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "Employee"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingRequirement"
    ADD CONSTRAINT "TrainingRequirement_trainingCode_fkey"
    FOREIGN KEY ("trainingCode") REFERENCES "Training"("code")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion"
    ADD CONSTRAINT "TrainingCompletion_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCompletion"
    ADD CONSTRAINT "TrainingCompletion_trainingCode_fkey"
    FOREIGN KEY ("trainingCode") REFERENCES "Training"("code")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession"
    ADD CONSTRAINT "TrainingSession_trainingCode_fkey"
    FOREIGN KEY ("trainingCode") REFERENCES "Training"("code")
    ON DELETE CASCADE ON UPDATE CASCADE;
