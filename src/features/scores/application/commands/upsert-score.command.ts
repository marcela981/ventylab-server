/*
 * Funcionalidad: Comando UpsertScoreCommand
 * Descripción: Datos para registrar o actualizar la calificación de un profesor a un estudiante sobre un elemento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ScoreEntityTypeValue } from "@/features/scores/domain/value-objects/score-entity-type";

export class UpsertScoreCommand {
  public readonly graderId: string;
  public readonly userId: string;
  public readonly entityType: ScoreEntityTypeValue;
  public readonly entityId: string;
  public readonly points: number;
  public readonly maxPoints: number;
  public readonly comments?: string;

  public constructor({
    graderId,
    userId,
    entityType,
    entityId,
    points,
    maxPoints,
    comments,
  }: {
    graderId: string;
    userId: string;
    entityType: ScoreEntityTypeValue;
    entityId: string;
    points: number;
    maxPoints: number;
    comments?: string;
  }) {
    this.graderId = graderId;
    this.userId = userId;
    this.entityType = entityType;
    this.entityId = entityId;
    this.points = points;
    this.maxPoints = maxPoints;
    this.comments = comments;
  }
}
