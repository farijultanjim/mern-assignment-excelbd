/*
  Warnings:

  - You are about to drop the column `agentId` on the `Parcel` table. All the data in the column will be lost.
  - The `status` column on the `Parcel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "public"."Parcel" DROP CONSTRAINT "Parcel_agentId_fkey";

-- AlterTable
ALTER TABLE "public"."Parcel" DROP COLUMN "agentId",
ADD COLUMN     "assignedAgentId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "public"."Parcel" ADD CONSTRAINT "Parcel_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
