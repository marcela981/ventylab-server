/*
 * Funcionalidad: Comando CreateActivityCommand
 * Descripción: Datos para crear una actividad evaluativa como docente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";

export class CreateActivityCommand {
  public readonly title: string;
  public readonly description?: string;
  public readonly instructions?: string;
  public readonly type: ActivityTypeValue;
  public readonly maxScore?: number;
  public readonly timeLimit?: number;
  public readonly dueDate?: Date;
  public readonly performedBy: string;

  public constructor({
    title,
    description,
    instructions,
    type,
    maxScore,
    timeLimit,
    dueDate,
    performedBy,
  }: {
    title: string;
    description?: string;
    instructions?: string;
    type: ActivityTypeValue;
    maxScore?: number;
    timeLimit?: number;
    dueDate?: Date;
    performedBy: string;
  }) {
    this.title = title;
    this.description = description;
    this.instructions = instructions;
    this.type = type;
    this.maxScore = maxScore;
    this.timeLimit = timeLimit;
    this.dueDate = dueDate;
    this.performedBy = performedBy;
  }
}
