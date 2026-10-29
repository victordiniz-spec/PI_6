/*
  Warnings:

  - A unique constraint covering the columns `[credencialHash]` on the table `tablets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tablets" ADD COLUMN     "credencialHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tablets_credencialHash_key" ON "tablets"("credencialHash");
