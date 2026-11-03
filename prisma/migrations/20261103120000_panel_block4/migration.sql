-- Block 4 (teacher panel, administration and profile). Additive only: one new enum value.
-- No existing row is updated or deleted; ratings without surface keep NULL and the surface is derived on read.

-- AlterEnum
ALTER TYPE "AiRatingSurface" ADD VALUE 'SIMULATOR_ASSIST';
