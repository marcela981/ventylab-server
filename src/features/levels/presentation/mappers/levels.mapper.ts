/*
 * Funcionalidad: Mapeador de presentación LevelsMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de niveles en DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LevelCurriculumItem, type LevelCurriculumModule } from "@/features/levels/domain/read-models/level-curriculum.read-model";
import {
  type LevelRoadmapNode,
  type LevelUnlockStatus,
  type PrerequisiteStatus,
} from "@/features/levels/domain/read-models/level-roadmap.read-model";
import {
  type CanDeleteLevelResult,
  type LevelDetail,
  type LevelDetailModule,
  type LevelModuleItem,
  type LevelPrerequisiteItem,
  type LevelPrerequisitesView,
  type LevelSummary,
} from "@/features/levels/domain/read-models/level-views.read-model";
import {
  LevelCurriculumDTO,
  LevelCurriculumModuleDTO,
  LevelRoadmapNodeDTO,
  LevelUnlockStatusDTO,
  PrerequisiteStatusDTO,
} from "@/features/levels/presentation/dtos/level-progress.dto";
import {
  CanDeleteLevelDTO,
  LevelDetailDTO,
  LevelDetailModuleDTO,
  LevelDTO,
  LevelModuleDTO,
  LevelPrerequisiteItemDTO,
  LevelPrerequisitesDTO,
} from "@/features/levels/presentation/dtos/level.dto";

export class LevelsMapper {
  public static toDTO(level: LevelSummary): LevelDTO {
    return new LevelDTO({
      id: level.id,
      title: level.title,
      track: level.track,
      description: level.description ?? null,
      order: level.order,
      isActive: level.isActive,
      status: level.status,
      sectionId: level.sectionId ?? null,
      color: level.color,
      tags: level.tags,
      parentId: level.parentId ?? null,
      lastModifiedBy: level.lastModifiedBy ?? null,
      lastModifiedAt: level.lastModifiedAt ?? null,
      createdAt: level.createdAt,
      updatedAt: level.updatedAt,
      moduleCount: level.moduleCount,
    });
  }

  public static toDetailDTO(level: LevelDetail): LevelDetailDTO {
    return new LevelDetailDTO({
      ...LevelsMapper.toDTO(level),
      modules: level.modules.map(
        (module: LevelDetailModule) =>
          new LevelDetailModuleDTO({
            id: module.id,
            title: module.title,
            description: module.description ?? null,
            difficulty: module.difficulty ?? null,
            estimatedTime: module.estimatedTime ?? null,
            order: module.order,
            thumbnail: module.thumbnail ?? null,
            status: module.status,
            lessonCount: module.lessonCount,
          }),
      ),
    });
  }

  public static toModuleDTO(module: LevelModuleItem): LevelModuleDTO {
    return new LevelModuleDTO({
      id: module.id,
      levelId: module.levelId ?? null,
      title: module.title,
      description: module.description ?? null,
      category: module.category ?? null,
      difficulty: module.difficulty ?? null,
      estimatedTime: module.estimatedTime ?? null,
      thumbnail: module.thumbnail ?? null,
      order: module.order,
      isActive: module.isActive,
      status: module.status,
      color: module.color ?? null,
      tags: module.tags,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      lessonCount: module.lessonCount,
      prerequisites: module.prerequisites.map((prerequisite: { id: string; title: string }) => ({ id: prerequisite.id, title: prerequisite.title })),
      levelColor: module.levelColor,
    });
  }

  public static toPrerequisitesDTO(view: LevelPrerequisitesView): LevelPrerequisitesDTO {
    return new LevelPrerequisitesDTO({
      levelId: view.levelId,
      levelTitle: view.levelTitle,
      prerequisites: view.prerequisites.map((item: LevelPrerequisiteItem) => LevelsMapper._toPrerequisiteItemDTO(item)),
      dependentLevels: view.dependentLevels.map((item: LevelPrerequisiteItem) => LevelsMapper._toPrerequisiteItemDTO(item)),
    });
  }

  public static toCanDeleteDTO(result: CanDeleteLevelResult): CanDeleteLevelDTO {
    return new CanDeleteLevelDTO({
      canDelete: result.canDelete,
      reason: result.reason ?? null,
      dependentLevels: result.dependentLevels ?? null,
      hasStudentProgress: result.hasStudentProgress ?? false,
    });
  }

  public static toCurriculumDTO(item: LevelCurriculumItem): LevelCurriculumDTO {
    return new LevelCurriculumDTO({
      id: item.id,
      dbId: item.dbId,
      track: item.track,
      title: item.title,
      description: item.description ?? null,
      color: item.color,
      emoji: item.emoji,
      order: item.order,
      modules: item.modules.map(
        (module: LevelCurriculumModule) =>
          new LevelCurriculumModuleDTO({
            id: module.id,
            title: module.title,
            description: module.description ?? null,
            difficulty: module.difficulty ?? null,
            estimatedTime: module.estimatedTime ?? null,
            order: module.order,
            category: module.category ?? null,
            progressPercentage: module.progressPercentage,
            isCompleted: module.isCompleted,
            lessonCount: module.lessonCount,
          }),
      ),
      totalModules: item.totalModules,
      completedModules: item.completedModules,
      progressPercentage: item.progressPercentage,
      isCompleted: item.isCompleted,
      isUnlocked: item.isUnlocked,
    });
  }

  public static toUnlockStatusDTO(status: LevelUnlockStatus, lockReasonPrefix: string): LevelUnlockStatusDTO {
    return new LevelUnlockStatusDTO({
      isLocked: status.isLocked,
      unlockedAt: status.unlockedAt ?? null,
      completedAt: status.completedAt ?? null,
      prerequisites: status.prerequisites.map(
        (prerequisite: PrerequisiteStatus) =>
          new PrerequisiteStatusDTO({
            levelId: prerequisite.levelId,
            levelTitle: prerequisite.levelTitle,
            isCompleted: prerequisite.isCompleted,
            completionPercentage: prerequisite.completionPercentage,
            completedAt: prerequisite.completedAt ?? null,
          }),
      ),
      lockReason: status.missingPrerequisites.length > 0 ? `${lockReasonPrefix} ${status.missingPrerequisites.join(", ")}` : null,
    });
  }

  public static toRoadmapNodeDTO(node: LevelRoadmapNode, lockReasonPrefix: string): LevelRoadmapNodeDTO {
    return new LevelRoadmapNodeDTO({
      levelId: node.levelId,
      levelTitle: node.levelTitle,
      levelDescription: node.levelDescription ?? null,
      order: node.order,
      isActive: node.isActive,
      unlockStatus: LevelsMapper.toUnlockStatusDTO(node.unlockStatus, lockReasonPrefix),
      moduleCount: node.moduleCount,
      completedModules: node.completedModules,
      levelProgress: node.levelProgress,
    });
  }

  private static _toPrerequisiteItemDTO(item: LevelPrerequisiteItem): LevelPrerequisiteItemDTO {
    return new LevelPrerequisiteItemDTO({
      id: item.id,
      levelId: item.levelId,
      levelTitle: item.levelTitle,
      order: item.order,
      isActive: item.isActive,
    });
  }
}
