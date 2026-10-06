/*
 * Funcionalidad: Mapeador de presentación CurriculumMapper
 * Descripción: Convierte los modelos de lectura y entidades de la feature de currículo en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type CurriculumLevelView,
  type CurriculumModuleView,
  type CurriculumNextModule,
  type CurriculumOverview,
  type CurriculumOverviewLevel,
} from "@/features/curriculum/domain/read-models/curriculum-views.read-model";
import {
  CurriculumDbModuleDTO,
  CurriculumLevelDTO,
  CurriculumModuleDTO,
  CurriculumModuleProgressDTO,
  CurriculumNextModuleDTO,
  CurriculumOverviewDTO,
  CurriculumOverviewLevelDTO,
  ModuleUnlockStatusDTO,
  NextModuleDTO,
} from "@/features/curriculum/presentation/dtos/curriculum.dto";

export class CurriculumMapper {
  public static toLevelDTO(view: CurriculumLevelView): CurriculumLevelDTO {
    return new CurriculumLevelDTO({
      level: view.level,
      levelColor: view.levelColor,
      modules: view.modules.map((module: CurriculumModuleView) => CurriculumMapper._toModuleDTO(module)),
      totalModules: view.totalModules,
      completedModules: view.completedModules,
      levelProgress: view.levelProgress,
    });
  }

  public static toOverviewDTO(overview: CurriculumOverview): CurriculumOverviewDTO {
    return new CurriculumOverviewDTO({
      levels: overview.levels.map(
        (level: CurriculumOverviewLevel) =>
          new CurriculumOverviewLevelDTO({
            ...CurriculumMapper.toLevelDTO(level),
            isOptional: level.isOptional,
            affectsUnlocking: level.affectsUnlocking,
          }),
      ),
      totalModules: overview.totalModules,
      mainLevelModules: overview.mainLevelModules,
    });
  }

  public static toUnlockStatusDTO(moduleId: string, isUnlocked: boolean): ModuleUnlockStatusDTO {
    return new ModuleUnlockStatusDTO({ moduleId, isUnlocked });
  }

  public static toNextModuleDTO(currentModuleId: string, nextModule: CurriculumNextModule | undefined): NextModuleDTO {
    return new NextModuleDTO({
      currentModuleId,
      nextModule: nextModule
        ? new CurriculumNextModuleDTO({
          id: nextModule.id,
          order: nextModule.order,
          title: nextModule.title,
          description: nextModule.description ?? null,
        })
        : null,
    });
  }

  private static _toModuleDTO(module: CurriculumModuleView): CurriculumModuleDTO {
    return new CurriculumModuleDTO({
      id: module.id,
      order: module.order,
      title: module.title,
      description: module.description ?? null,
      dbModule: module.dbModule
        ? new CurriculumDbModuleDTO({
          id: module.dbModule.id,
          levelId: module.dbModule.levelId ?? null,
          title: module.dbModule.title,
          description: module.dbModule.description ?? null,
          difficulty: module.dbModule.difficulty ?? null,
          estimatedTime: module.dbModule.estimatedTime ?? null,
          order: module.dbModule.order,
          isActive: module.dbModule.isActive,
          lessonCount: module.dbModule.lessonCount,
        })
        : null,
      progress: module.progress
        ? new CurriculumModuleProgressDTO({
          completed: module.progress.completed,
          completionPercentage: module.progress.completionPercentage,
          timeSpent: module.progress.timeSpent,
        })
        : null,
      isLocked: module.isLocked,
      lessonCount: module.lessonCount,
    });
  }
}
