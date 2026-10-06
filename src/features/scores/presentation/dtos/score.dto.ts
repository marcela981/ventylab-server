/*
 * Funcionalidad: DTOs de respuesta de calificaciones
 * Descripción: Formas de respuesta documentadas en Swagger para calificaciones, la persona relacionada (estudiante o profesor) y el ID de la calificación registrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { SCORE_ENTITY_TYPE_VALUES } from "@/features/scores/domain/value-objects/score-entity-type";

export class ScoreIdDTO {
  @ApiProperty({ description: "Identifier of the recorded score", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class ScorePersonDTO {
  @ApiProperty({ description: "User ID", example: "cm5user01" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "ana@example.com" })
  public email: string;

  public constructor({ id, name, email }: { id: string; name: string | null; email: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

export interface ScoreDTOFields {
  id: string;
  userId: string;
  graderId: string;
  entityType: string;
  entityId: string;
  points: number;
  maxPoints: number;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
  student: ScorePersonDTO | null;
  grader: ScorePersonDTO | null;
}

export class ScoreDTO {
  @ApiProperty({ description: "Score ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Student user ID", example: "cm5student01" })
  public userId: string;

  @ApiProperty({ description: "Teacher user ID", example: "cm5teacher01" })
  public graderId: string;

  @ApiProperty({ description: "Type of the graded element", enum: SCORE_ENTITY_TYPE_VALUES, example: "MODULE" })
  public entityType: string;

  @ApiProperty({ description: "ID of the graded element, or a custom label", example: "cm5module01" })
  public entityId: string;

  @ApiProperty({ description: "Points awarded", example: 85 })
  public points: number;

  @ApiProperty({ description: "Maximum points", example: 100 })
  public maxPoints: number;

  @ApiProperty({ description: "Teacher comments", example: "Good work", nullable: true, type: String })
  public comments: string | null;

  @ApiProperty({ description: "Creation date", example: "2026-03-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update date", example: "2026-03-01T10:00:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Graded student (grader listing only)", type: ScorePersonDTO, nullable: true })
  public student: ScorePersonDTO | null;

  @ApiProperty({ description: "Teacher who assigned the score (student listing only)", type: ScorePersonDTO, nullable: true })
  public grader: ScorePersonDTO | null;

  public constructor(fields: ScoreDTOFields) {
    this.id = fields.id;
    this.userId = fields.userId;
    this.graderId = fields.graderId;
    this.entityType = fields.entityType;
    this.entityId = fields.entityId;
    this.points = fields.points;
    this.maxPoints = fields.maxPoints;
    this.comments = fields.comments;
    this.createdAt = fields.createdAt;
    this.updatedAt = fields.updatedAt;
    this.student = fields.student;
    this.grader = fields.grader;
  }
}
