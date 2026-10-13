-- Funcionalidad: Migración fix_setnull_required_relations
-- Descripción: Vuelve opcionales las columnas de autoría cuyas llaves foráneas usan ON DELETE SET NULL, para que borrar un usuario conserve el historial en lugar de violar NOT NULL
-- Versión: 1.0
-- Autor: Marcela Mazo Castro
-- Proyecto: VentyLab
-- Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
-- Institución: Universidad del Valle
-- Contacto: marcela.mazo@correounivalle.edu.co

-- AlterTable
ALTER TABLE "change_logs" ALTER COLUMN "changedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "content_overrides" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "activities" ALTER COLUMN "createdBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "activity_assignments" ALTER COLUMN "assignedBy" DROP NOT NULL;
