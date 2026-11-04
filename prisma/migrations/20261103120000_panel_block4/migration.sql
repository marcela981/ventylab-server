-- Block 4 (teacher panel, administration and profile). Additive only: one new enum value and one new nullable column.
-- No existing row is updated or deleted: ratings without surface keep NULL (the surface is derived on read) and
-- the base64 images already stored in users.image stay as they are.

-- AlterEnum
ALTER TYPE "AiRatingSurface" ADD VALUE 'SIMULATOR_ASSIST';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_media_id" TEXT;

-- CreateIndex
CREATE INDEX "users_avatar_media_id_idx" ON "users"("avatar_media_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_media_id_fkey" FOREIGN KEY ("avatar_media_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
