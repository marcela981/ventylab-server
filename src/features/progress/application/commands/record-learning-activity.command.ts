/*
 * Funcionalidad: Comando RecordLearningActivityCommand
 * Descripción: Datos de un hecho de aprendizaje que se registra en el registro de actividad: usuario, tipo, referencia, instante y, para un logro, su recompensa de XP
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LearningActivityKindValue } from "@/features/progress/domain/value-objects/learning-activity-kind";

export class RecordLearningActivityCommand {
  public readonly userId: string;
  public readonly kind: LearningActivityKindValue;
  public readonly refId: string;
  public readonly occurredAt: Date;
  public readonly achievementReward: number;

  public constructor({
    userId,
    kind,
    refId,
    occurredAt,
    achievementReward = 0,
  }: {
    userId: string;
    kind: LearningActivityKindValue;
    refId: string;
    occurredAt: Date;
    achievementReward?: number;
  }) {
    this.userId = userId;
    this.kind = kind;
    this.refId = refId;
    this.occurredAt = occurredAt;
    this.achievementReward = achievementReward;
  }
}
