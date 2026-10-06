/*
 * Funcionalidad: Mapeador de presentación OverridesMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de personalizaciones de contenido por estudiante en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ContentOverrideView, type OverrideUserSummary } from "@/features/overrides/domain/read-models/content-override-view.read-model";
import { type ExtraCard, type FieldOverrides, type OverrideData } from "@/features/overrides/domain/value-objects/override-data";
import { ContentOverrideDTO, ContentOverridesListDTO, OverrideUserDTO } from "@/features/overrides/presentation/dtos/content-override.dto";
import { type ExtraCardDTO, type FieldOverridesDTO, type OverrideDataDTO } from "@/features/overrides/presentation/dtos/override-request.dto";

export class OverridesMapper {
  public static toOverrideData(dto: OverrideDataDTO): OverrideData {
    const data: { fieldOverrides?: FieldOverrides; extraCards?: ExtraCard[]; hiddenCardIds?: string[] } = {};

    if (dto.fieldOverrides) data.fieldOverrides = OverridesMapper._toFieldOverrides(dto.fieldOverrides);
    if (dto.hiddenCardIds) data.hiddenCardIds = [...dto.hiddenCardIds];

    if (dto.extraCards) {
      data.extraCards = dto.extraCards.map((card: ExtraCardDTO) => ({
        id: card.id,
        ...(card.title !== undefined ? { title: card.title } : {}),
        content: card.content,
        contentType: card.contentType,
        insertAfterOrder: card.insertAfterOrder,
      }));
    }

    return data;
  }

  public static toDTO(override: ContentOverrideView): ContentOverrideDTO {
    return new ContentOverrideDTO({
      id: override.id,
      studentId: override.studentId,
      entityType: override.entityType,
      entityId: override.entityId,
      overrideData: { ...override.overrideData },
      createdBy: override.createdBy,
      createdAt: override.createdAt,
      updatedAt: override.updatedAt,
      isActive: override.isActive,
      student: OverridesMapper._toUserDTO(override.student),
      creator: OverridesMapper._toUserDTO(override.creator),
    });
  }

  public static toListDTO(studentId: string, overrides: ContentOverrideView[]): ContentOverridesListDTO {
    return new ContentOverridesListDTO({
      studentId,
      count: overrides.length,
      overrides: overrides.map((override: ContentOverrideView) => OverridesMapper.toDTO(override)),
    });
  }

  private static _toFieldOverrides(dto: FieldOverridesDTO): FieldOverrides {
    return Object.fromEntries(Object.entries({ ...dto }).filter(([, value]: [string, unknown]) => value !== undefined));
  }

  private static _toUserDTO(user?: OverrideUserSummary): OverrideUserDTO | null {
    return user ? new OverrideUserDTO({ id: user.id, name: user.name ?? null, email: user.email }) : null;
  }
}
