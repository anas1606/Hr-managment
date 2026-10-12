-- AlterTable
ALTER TABLE "StaffProfile" ADD COLUMN "bankAccountHolder" TEXT;
ALTER TABLE "StaffProfile" ADD COLUMN "bankName" TEXT;
ALTER TABLE "StaffProfile" ADD COLUMN "accountNumber" TEXT;
ALTER TABLE "StaffProfile" ADD COLUMN "ifscCode" TEXT;
ALTER TABLE "StaffProfile" ADD COLUMN "branchName" TEXT;

-- CreateTable
CREATE TABLE "StaffDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "netPay" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalarySlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffDocument_userId_idx" ON "StaffDocument"("userId");

-- CreateIndex
CREATE INDEX "SalarySlip_userId_idx" ON "SalarySlip"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SalarySlip_userId_month_year_key" ON "SalarySlip"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "StaffDocument" ADD CONSTRAINT "StaffDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalarySlip" ADD CONSTRAINT "SalarySlip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
