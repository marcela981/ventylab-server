/*
 * Funcionalidad: Mapeador de presentación StepsMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de pasos (tarjetas) en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type StepDetail, type StepListItem, type StepSummary } from "@/features/steps/domain/read-models/step-views.read-model";
import {
  StepDetailDTO,
  StepDetailLessonDTO,
  StepDTO,
  StepLessonDTO,
  StepListItemDTO,
  StepModuleDTO,
} from "@/features/steps/presentation/dtos/step.dto";

export class StepsMapper {
  public static toDTO(step: StepSummary): StepDTO {
    return new StepDTO({
      id: step.id,
      lessonId: step.lessonId,
      title: step.title ?? null,
      content: step.content,
      contentType: step.contentType,
      order: step.order,
      isActive: step.isActive,
      lastModifiedBy: step.lastModifiedBy ?? null,
      lastModifiedAt: step.lastModifiedAt ?? null,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
    });
  }

  public static toListItemDTO(step: StepListItem): StepListItemDTO {
    return new StepListItemDTO({
      ...StepsMapper.toDTO(step),
      lesson: new StepLessonDTO({ id: step.lesson.id, title: step.lesson.title, moduleId: step.lesson.moduleId }),
    });
  }

  public static toDetailDTO(step: StepDetail): StepDetailDTO {
    return new StepDetailDTO({
      ...StepsMapper.toDTO(step),
      lesson: new StepDetailLessonDTO({
        id: step.lesson.id,
        title: step.lesson.title,
        moduleId: step.lesson.moduleId,
        module: new StepModuleDTO({
          id: step.lesson.module.id,
          title: step.lesson.module.title,
          levelId: step.lesson.module.levelId ?? null,
        }),
      }),
    });
  }
}
