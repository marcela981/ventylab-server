/*
 * Funcionalidad: Resultados de lectura de evaluaciones para gestión
 * Descripción: Elemento del listado de gestión (resumen y si el llamador puede gestionarla) y detalle de gestión (agregado completo con respuestas correctas, conteos de uso, problemas de preparación, URLs firmadas de los medios y si el llamador puede gestionarla)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ResolvedMediaURL } from "@/common/application/ports/media-url-resolver.interface";
import { type Evaluation } from "@/features/evaluation/domain/entities/evaluation.entity";
import { type EvaluationSummaryView, type EvaluationUsage } from "@/features/evaluation/domain/read-models/evaluation.read-model";
import { type EvaluationReadinessIssue } from "@/features/evaluation/domain/services/evaluation-readiness";

export class EvaluationListItemResult {
  public readonly summary: EvaluationSummaryView;
  public readonly canManage: boolean;

  public constructor({ summary, canManage }: { summary: EvaluationSummaryView; canManage: boolean }) {
    this.summary = summary;
    this.canManage = canManage;
  }
}

export class EvaluationDetailResult {
  public readonly evaluation: Evaluation;
  public readonly usage: EvaluationUsage;
  public readonly readinessIssues: ReadonlyArray<EvaluationReadinessIssue>;
  public readonly mediaUrls: ReadonlyMap<string, ResolvedMediaURL>;
  public readonly canManage: boolean;

  public constructor({
    evaluation,
    usage,
    readinessIssues,
    mediaUrls,
    canManage,
  }: {
    evaluation: Evaluation;
    usage: EvaluationUsage;
    readinessIssues: ReadonlyArray<EvaluationReadinessIssue>;
    mediaUrls: ReadonlyMap<string, ResolvedMediaURL>;
    canManage: boolean;
  }) {
    this.evaluation = evaluation;
    this.usage = usage;
    this.readinessIssues = readinessIssues;
    this.mediaUrls = mediaUrls;
    this.canManage = canManage;
  }
}
