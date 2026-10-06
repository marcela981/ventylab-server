/*
 * Funcionalidad: Comando CreateEvaluationAssignmentsCommand
 * Descripción: Intención de activar una evaluación para uno o varios grupos STUDENT en una ventana [startsAt, endsAt]
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export class CreateEvaluationAssignmentsCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly groupIds: ReadonlyArray<string>;
  public readonly startsAt: Date;
  public readonly endsAt: Date;

  public constructor({
    evaluationId,
    actor,
    groupIds,
    startsAt,
    endsAt,
  }: {
    evaluationId: string;
    actor: EvaluationActor;
    groupIds: ReadonlyArray<string>;
    startsAt: Date;
    endsAt: Date;
  }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.groupIds = groupIds;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
  }
}
