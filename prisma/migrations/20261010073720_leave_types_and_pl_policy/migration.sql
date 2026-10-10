-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('PL', 'GL', 'SL');

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "type" "LeaveType" NOT NULL DEFAULT 'GL';

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "plPerMonth" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "plPerYear" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "yearEndMonth" INTEGER NOT NULL DEFAULT 12,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaveRequest_type_idx" ON "LeaveRequest"("type");
