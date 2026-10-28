/*
 * Funcionalidad: DTOs de gamificación
 * Descripción: Define las consultas (rango del calendario de actividad y límite de la actividad reciente) y las respuestas de gamificación: estadísticas (XP, nivel, racha), días de actividad por fecha de America/Bogota y actividad reciente del registro con títulos
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Matches, Max, Min } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { LEARNING_ACTIVITY_KIND_VALUES } from "@/features/progress/domain/value-objects/learning-activity-kind";

const LOCAL_DATE_FORMAT: RegExp = /^\d{4}-\d{2}-\d{2}$/;

export class ActivityCalendarQueryDTO {
  @ApiPropertyOptional({ description: "First day (America/Bogota, YYYY-MM-DD, inclusive); defaults to 365 days before `to`", example: "2026-01-01", format: "date" })
  @IsOptional()
  @Matches(LOCAL_DATE_FORMAT, { message: i18nValidationMessage("progress.validation.activity_date_invalid") })
  public from?: string;

  @ApiPropertyOptional({ description: "Last day (America/Bogota, YYYY-MM-DD, inclusive); defaults to today. At most 366 days from `from`", example: "2026-10-28", format: "date" })
  @IsOptional()
  @Matches(LOCAL_DATE_FORMAT, { message: i18nValidationMessage("progress.validation.activity_date_invalid") })
  public to?: string;
}

export class RecentActivityQueryDTO {
  @ApiPropertyOptional({ description: "Maximum number of entries", example: 10, minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage("progress.validation.recent_limit_invalid") })
  @Min(1, { message: i18nValidationMessage("progress.validation.recent_limit_invalid") })
  @Max(50, { message: i18nValidationMessage("progress.validation.recent_limit_invalid") })
  public limit?: number;
}

export class GamificationStatsDTO {
  @ApiProperty({ description: "Total experience points in the activity ledger", example: 1255 })
  public xpTotal: number;

  @ApiProperty({ description: "Current level: floor(xpTotal / 500) + 1", example: 3 })
  public level: number;

  @ApiProperty({ description: "Experience points earned inside the current level (0 to 499)", example: 255 })
  public xpIntoLevel: number;

  @ApiProperty({ description: "Total experience points at which the next level starts (level × 500)", example: 1500 })
  public nextLevelXp: number;

  @ApiProperty({ description: "Consecutive America/Bogota days with activity ending today or yesterday", example: 4 })
  public streakDays: number;

  @ApiProperty({ description: "Longest run of consecutive days with activity", example: 9 })
  public longestStreak: number;

  @ApiProperty({ description: "Experience points earned today (America/Bogota)", example: 55 })
  public xpToday: number;

  public constructor({ xpTotal, level, xpIntoLevel, nextLevelXp, streakDays, longestStreak, xpToday }: GamificationStatsDTO) {
    this.xpTotal = xpTotal;
    this.level = level;
    this.xpIntoLevel = xpIntoLevel;
    this.nextLevelXp = nextLevelXp;
    this.streakDays = streakDays;
    this.longestStreak = longestStreak;
    this.xpToday = xpToday;
  }
}

export class ActivityDayDTO {
  @ApiProperty({ description: "America/Bogota calendar day (YYYY-MM-DD)", example: "2026-10-27", format: "date" })
  public date: string;

  @ApiProperty({ description: "Number of ledger events on that day", example: 6 })
  public count: number;

  @ApiProperty({ description: "Experience points earned on that day", example: 75 })
  public xp: number;

  public constructor({ date, count, xp }: ActivityDayDTO) {
    this.date = date;
    this.count = count;
    this.xp = xp;
  }
}

export class ActivityCalendarDTO {
  @ApiProperty({ description: "Days with activity in the range, ascending; days without activity are omitted", type: ActivityDayDTO, isArray: true })
  public days: ActivityDayDTO[];

  public constructor({ days }: ActivityCalendarDTO) {
    this.days = days;
  }
}

export class RecentActivityItemDTO {
  @ApiProperty({ description: "Ledger entry ID", example: "0192f1c4-7a1e-7c3b-9a55-2f1e4d1b7c10" })
  public id: string;

  @ApiProperty({ description: "Kind of learning fact", enum: LEARNING_ACTIVITY_KIND_VALUES, example: "LESSON_COMPLETED" })
  public kind: string;

  @ApiProperty({ description: "ID of the lesson, module, evaluation, page or achievement code the entry refers to", example: "lesson-01-intro" })
  public refId: string;

  @ApiProperty({ description: "Experience points of the entry", example: 50 })
  public xp: number;

  @ApiProperty({ description: "When the fact happened (ISO 8601)", example: "2026-10-27T15:04:05.000Z" })
  public occurredAt: string;

  @ApiProperty({ description: "Title of the referenced item, or null when it no longer exists", example: "Introducción a la ventilación", nullable: true, type: String })
  public title: string | null;

  public constructor({ id, kind, refId, xp, occurredAt, title }: RecentActivityItemDTO) {
    this.id = id;
    this.kind = kind;
    this.refId = refId;
    this.xp = xp;
    this.occurredAt = occurredAt;
    this.title = title;
  }
}
