-- Ajustes D4 (themes): the appearance preference of each user. Additive only: two nullable columns, no row is
-- updated (NULL = not chosen yet: the web follows the system mode and the VentyLab palette).

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "theme_mode" TEXT,
ADD COLUMN     "theme_palette" TEXT;
