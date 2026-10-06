/*
 * Funcionalidad: Comando AddEvaluationQuestionCommand
 * Descripción: Intención de agregar una pregunta (con sus opciones) a una evaluación; lleva el ejecutor (id y rol) para aplicar la política de gestión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type NewEvaluationOption } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";
import { type EvaluationQuestionTypeValue } from "@/features/evaluation/domain/value-objects/evaluation-question-type";

export class AddEvaluationQuestionCommand {
  public readonly evaluationId: string;
  public readonly actor: EvaluationActor;
  public readonly type: EvaluationQuestionTypeValue;
  public readonly prompt: unknown;
  public readonly points?: number;
  public readonly explanation?: string;
  public readonly scenarioId?: string;
  public readonly mediaIds?: string[];
  public readonly clinicalCaseId?: string;
  public readonly rubric?: Record<string, unknown>;
  public readonly options?: NewEvaluationOption[];

  public constructor({ evaluationId, actor, type, prompt, points, explanation, scenarioId, mediaIds, clinicalCaseId, rubric, options }: { evaluationId: string; actor: EvaluationActor; type: EvaluationQuestionTypeValue; prompt: unknown; points?: number; explanation?: string; scenarioId?: string; mediaIds?: string[]; clinicalCaseId?: string; rubric?: Record<string, unknown>; options?: NewEvaluationOption[] }) {
    this.evaluationId = evaluationId;
    this.actor = actor;
    this.type = type;
    this.prompt = prompt;
    this.points = points;
    this.explanation = explanation;
    this.scenarioId = scenarioId;
    this.mediaIds = mediaIds;
    this.clinicalCaseId = clinicalCaseId;
    this.rubric = rubric;
    this.options = options;
  }
}
