/*
  Warnings:

  - You are about to drop the column `label` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "label",
ADD COLUMN     "items" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "traceId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "orders_traceId_idx" ON "orders"("traceId");
