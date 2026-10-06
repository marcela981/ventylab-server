-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ventilator_reservations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "deviceId" TEXT NOT NULL DEFAULT 'ventilab-device-001',
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "durationMinutes" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "purpose" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventilator_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulator_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicalCaseId" TEXT,
    "isRealVentilator" BOOLEAN NOT NULL DEFAULT false,
    "parametersLog" JSONB NOT NULL,
    "ventilatorData" JSONB NOT NULL,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "simulator_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ventilator_reservations_status_idx" ON "ventilator_reservations"("status");

-- CreateIndex
CREATE INDEX "ventilator_reservations_userId_idx" ON "ventilator_reservations"("userId");

-- CreateIndex
CREATE INDEX "ventilator_reservations_deviceId_status_idx" ON "ventilator_reservations"("deviceId", "status");

-- CreateIndex
CREATE INDEX "simulator_sessions_userId_idx" ON "simulator_sessions"("userId");

-- CreateIndex
CREATE INDEX "simulator_sessions_clinicalCaseId_idx" ON "simulator_sessions"("clinicalCaseId");

-- CreateIndex
CREATE INDEX "simulator_sessions_startedAt_idx" ON "simulator_sessions"("startedAt");

-- AddForeignKey
ALTER TABLE "ventilator_reservations" ADD CONSTRAINT "ventilator_reservations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulator_sessions" ADD CONSTRAINT "simulator_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulator_sessions" ADD CONSTRAINT "simulator_sessions_clinicalCaseId_fkey" FOREIGN KEY ("clinicalCaseId") REFERENCES "clinical_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
