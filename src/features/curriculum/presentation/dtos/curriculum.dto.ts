/*
 * Funcionalidad: DTOs curriculum.dto
 * Descripción: Define los DTOs CurriculumDbModuleDTO, CurriculumModuleProgressDTO, CurriculumModuleDTO, CurriculumLevelDTO, CurriculumOverviewLevelDTO, CurriculumOverviewDTO y otros de la feature de currículo, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class CurriculumDbModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Level ID", example: "level-beginner", nullable: true, type: String })
  public levelId: string | null;

  @ApiProperty({ description: "Module title", example: "Inversión fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Module difficulty", example: "beginner", nullable: true, type: String })
  public difficulty: string | null;

  @ApiProperty({ description: "Estimated time in minutes", example: 45, nullable: true, type: Number })
  public estimatedTime: number | null;

  @ApiProperty({ description: "Display order", example: 1 })
  public order: number;

  @ApiProperty({ description: "Whether the module is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Number of lessons", example: 4 })
  public lessonCount: number;

  public constructor({ id, levelId, title, description, difficulty, estimatedTime, order, isActive, lessonCount }: CurriculumDbModuleDTO) {
    this.id = id;
    this.levelId = levelId;
    this.title = title;
    this.description = description;
    this.difficulty = difficulty;
    this.estimatedTime = estimatedTime;
    this.order = order;
    this.isActive = isActive;
    this.lessonCount = lessonCount;
  }
}

export class CurriculumModuleProgressDTO {
  @ApiProperty({ description: "Whether the user completed the module", example: false })
  public completed: boolean;

  @ApiProperty({ description: "100 when completed, 0 otherwise", example: 0 })
  public completionPercentage: number;

  @ApiProperty({ description: "Time spent in the module, in seconds", example: 600 })
  public timeSpent: number;

  public constructor({ completed, completionPercentage, timeSpent }: CurriculumModuleProgressDTO) {
    this.completed = completed;
    this.completionPercentage = completionPercentage;
    this.timeSpent = timeSpent;
  }
}

export class CurriculumModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-01-inversion-fisiologica" })
  public id: string;

  @ApiProperty({ description: "Order within the level", example: 1 })
  public order: number;

  @ApiProperty({ description: "Module title", example: "Inversión Fisiológica" })
  public title: string;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Matching active database module", example: null, nullable: true, type: CurriculumDbModuleDTO })
  public dbModule: CurriculumDbModuleDTO | null;

  @ApiProperty({ description: "User progress, when authenticated and started", example: null, nullable: true, type: CurriculumModuleProgressDTO })
  public progress: CurriculumModuleProgressDTO | null;

  @ApiProperty({ description: "Whether the previous module must be completed first", example: false })
  public isLocked: boolean;

  @ApiProperty({ description: "Number of lessons", example: 4 })
  public lessonCount: number;

  public constructor({ id, order, title, description, dbModule, progress, isLocked, lessonCount }: CurriculumModuleDTO) {
    this.id = id;
    this.order = order;
    this.title = title;
    this.description = description;
    this.dbModule = dbModule;
    this.progress = progress;
    this.isLocked = isLocked;
    this.lessonCount = lessonCount;
  }
}

export class CurriculumLevelDTO {
  @ApiProperty({ description: "Curriculum level", example: "beginner" })
  public level: string;

  @ApiProperty({ description: "Level color", example: "#4CAF50" })
  public levelColor: string;

  @ApiProperty({ description: "Modules of the level", example: [], type: [CurriculumModuleDTO] })
  public modules: CurriculumModuleDTO[];

  @ApiProperty({ description: "Number of modules", example: 6 })
  public totalModules: number;

  @ApiProperty({ description: "Number of completed modules", example: 2 })
  public completedModules: number;

  @ApiProperty({ description: "Completed modules over total modules, rounded, 0 to 100", example: 33 })
  public levelProgress: number;

  public constructor({ level, levelColor, modules, totalModules, completedModules, levelProgress }: CurriculumLevelDTO) {
    this.level = level;
    this.levelColor = levelColor;
    this.modules = modules;
    this.totalModules = totalModules;
    this.completedModules = completedModules;
    this.levelProgress = levelProgress;
  }
}

export class CurriculumOverviewLevelDTO extends CurriculumLevelDTO {
  @ApiProperty({ description: "Whether the level is optional", example: false })
  public isOptional: boolean;

  @ApiProperty({ description: "Whether the level affects unlocking", example: true })
  public affectsUnlocking: boolean;

  public constructor({ isOptional, affectsUnlocking, ...base }: CurriculumOverviewLevelDTO) {
    super(base);
    this.isOptional = isOptional;
    this.affectsUnlocking = affectsUnlocking;
  }
}

export class CurriculumOverviewDTO {
  @ApiProperty({ description: "Prerequisites and beginner levels", example: [], type: [CurriculumOverviewLevelDTO] })
  public levels: CurriculumOverviewLevelDTO[];

  @ApiProperty({ description: "Number of modules in both levels", example: 8 })
  public totalModules: number;

  @ApiProperty({ description: "Number of modules in non-optional levels", example: 6 })
  public mainLevelModules: number;

  public constructor({ levels, totalModules, mainLevelModules }: CurriculumOverviewDTO) {
    this.levels = levels;
    this.totalModules = totalModules;
    this.mainLevelModules = mainLevelModules;
  }
}

export class ModuleUnlockStatusDTO {
  @ApiProperty({ description: "Module ID", example: "module-02-ecuacion-movimiento" })
  public moduleId: string;

  @ApiProperty({ description: "Whether the module is unlocked for the user", example: true })
  public isUnlocked: boolean;

  public constructor({ moduleId, isUnlocked }: ModuleUnlockStatusDTO) {
    this.moduleId = moduleId;
    this.isUnlocked = isUnlocked;
  }
}

export class CurriculumNextModuleDTO {
  @ApiProperty({ description: "Module ID", example: "module-02-ecuacion-movimiento" })
  public id: string;

  @ApiProperty({ description: "Order", example: 2 })
  public order: number;

  @ApiProperty({ description: "Module title", example: "Ecuación de Movimiento" })
  public title: string;

  @ApiProperty({ description: "Module description", example: null, nullable: true, type: String })
  public description: string | null;

  public constructor({ id, order, title, description }: CurriculumNextModuleDTO) {
    this.id = id;
    this.order = order;
    this.title = title;
    this.description = description;
  }
}

export class NextModuleDTO {
  @ApiProperty({ description: "Current module ID", example: "module-01-inversion-fisiologica" })
  public currentModuleId: string;

  @ApiProperty({ description: "Next module, or null when there is none", example: null, nullable: true, type: CurriculumNextModuleDTO })
  public nextModule: CurriculumNextModuleDTO | null;

  public constructor({ currentModuleId, nextModule }: NextModuleDTO) {
    this.currentModuleId = currentModuleId;
    this.nextModule = nextModule;
  }
}
