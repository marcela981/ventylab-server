/*
 * Funcionalidad: DTOs de gamificación del progreso
 * Descripción: Define las respuestas de logros desbloqueados, hitos y habilidades del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class AchievementDTO {
  @ApiProperty({ description: "Achievement ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Achievement title", example: "Primer Paso" })
  public title: string;

  @ApiProperty({ description: "Achievement description", example: "Completa tu primera lección", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Achievement icon", example: "🎯", nullable: true, type: String })
  public icon: string | null;

  @ApiProperty({ description: "When the achievement was unlocked", example: "2026-03-10T14:20:00.000Z", type: Date })
  public unlockedAt: Date;

  @ApiProperty({ description: "Experience points rewarded by the achievement", example: 50 })
  public xpReward: number;

  public constructor({ id, title, description, icon, unlockedAt, xpReward }: AchievementDTO) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.icon = icon;
    this.unlockedAt = unlockedAt;
    this.xpReward = xpReward;
  }
}

export class AchievementsDTO {
  @ApiProperty({ description: "Unlocked achievements, newest first", type: () => AchievementDTO, isArray: true })
  public achievements: AchievementDTO[];

  @ApiProperty({ description: "Number of unlocked achievements", example: 1 })
  public totalUnlocked: number;

  public constructor({ achievements, totalUnlocked }: AchievementsDTO) {
    this.achievements = achievements;
    this.totalUnlocked = totalUnlocked;
  }
}

export class MilestoneDTO {
  @ApiProperty({ description: "Milestone ID", example: "first-module" })
  public id: string;

  @ApiProperty({ description: "Milestone title", example: "Primer módulo" })
  public title: string;

  @ApiProperty({ description: "Whether the milestone is completed", example: false })
  public completed: boolean;

  public constructor({ id, title, completed }: MilestoneDTO) {
    this.id = id;
    this.title = title;
    this.completed = completed;
  }
}

export class MilestonesDTO {
  @ApiProperty({ description: "Milestones", type: () => MilestoneDTO, isArray: true })
  public milestones: MilestoneDTO[];

  @ApiProperty({ description: "Number of completed milestones", example: 0 })
  public totalCompleted: number;

  @ApiProperty({ description: "Number of available milestones", example: 0 })
  public totalAvailable: number;

  @ApiProperty({ description: "Next milestone to reach", type: () => MilestoneDTO, nullable: true })
  public nextMilestone: MilestoneDTO | null;

  public constructor({ milestones, totalCompleted, totalAvailable, nextMilestone }: MilestonesDTO) {
    this.milestones = milestones;
    this.totalCompleted = totalCompleted;
    this.totalAvailable = totalAvailable;
    this.nextMilestone = nextMilestone;
  }
}

export class SkillDTO {
  @ApiProperty({ description: "Skill or category ID", example: "physiology" })
  public id: string;

  @ApiProperty({ description: "Skill or category name", example: "Fisiología Respiratoria" })
  public name: string;

  @ApiProperty({ description: "Progress, 0 to 100", example: 0 })
  public progress: number;

  public constructor({ id, name, progress }: SkillDTO) {
    this.id = id;
    this.name = name;
    this.progress = progress;
  }
}

export class SkillsDTO {
  @ApiProperty({ description: "Skills", type: () => SkillDTO, isArray: true })
  public skills: SkillDTO[];

  @ApiProperty({ description: "Skill categories", type: () => SkillDTO, isArray: true })
  public categories: SkillDTO[];

  @ApiProperty({ description: "Overall skill level", example: "beginner" })
  public overallLevel: string;

  public constructor({ skills, categories, overallLevel }: SkillsDTO) {
    this.skills = skills;
    this.categories = categories;
    this.overallLevel = overallLevel;
  }
}
