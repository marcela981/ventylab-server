/*
 * Funcionalidad: Mapeador de persistencia ContentOverrideViewRow
 * Descripción: Convierte entre los modelos de Prisma y las entidades de dominio de la feature de personalizaciones de contenido por estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentOverride as ContentOverrideModel, type Prisma } from "@prisma/client";

import { ContentOverride } from "@/features/overrides/domain/entities/content-override.entity";
import { type ContentOverrideView, type OverrideUserSummary } from "@/features/overrides/domain/read-models/content-override-view.read-model";
import { type OverrideData } from "@/features/overrides/domain/value-objects/override-data";

type UserSummaryRow = { id: string; name: string | null; email: string };

export type ContentOverrideViewRow = ContentOverrideModel & { student: UserSummaryRow | null; creator: UserSummaryRow | null };

export class OverridesMapper {
  public static toDomain(row: ContentOverrideModel): ContentOverride {
    return ContentOverride.reconstitute({
      id: row.id,
      studentId: row.studentId,
      entityType: row.entityType,
      entityId: row.entityId,
      overrideData: row.overrideData as OverrideData,
      createdBy: row.createdBy,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(override: ContentOverride): Prisma.ContentOverrideUncheckedCreateInput {
    return {
      id: override.id,
      studentId: override.studentId,
      entityType: override.entityType,
      entityId: override.entityId,
      overrideData: override.overrideData as Prisma.InputJsonObject,
      createdBy: override.createdBy,
      isActive: override.isActive,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
    };
  }

  public static toView(row: ContentOverrideViewRow): ContentOverrideView {
    return {
      id: row.id,
      studentId: row.studentId,
      entityType: row.entityType,
      entityId: row.entityId,
      overrideData: row.overrideData as OverrideData,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isActive: row.isActive,
      student: OverridesMapper._toUserSummary(row.student),
      creator: OverridesMapper._toUserSummary(row.creator),
    };
  }

  private static _toUserSummary(row: UserSummaryRow | null): OverrideUserSummary | undefined {
    return row ? { id: row.id, name: row.name ?? undefined, email: row.email } : undefined;
  }
}
