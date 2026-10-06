/*
 * Funcionalidad: Errores de dominio de evaluaciones
 * Descripción: Errores de la feature de evaluaciones (evaluación, escenario, pregunta u opción inexistentes, alcance de gestión, bloqueo estructural por intentos entregados, validación de READY, transición de estado, opciones no admitidas, reordenamiento, contenido enriquecido, medios y referencias inexistentes) de sus asignaciones (inexistente, alcance de grupo, evaluación no activable, grupo destino inválido, ventana inválida, solapamiento, asignación cerrada e intentos existentes) y de los intentos de estudiante (evaluación no abierta, límite de intentos, plazo vencido, intento inexistente, no en curso o heredado de solo lectura, respuesta inválida) y de la retroalimentación de calificación (no disponible antes de publicar la nota, intento sin calificar, revisión fuera de alcance) y de la calificación docente (fuera de alcance, intento en curso no calificable, publicación de un intento no calificado, puntaje manual fuera de rango, sobrescritura sin comentario) con sus claves i18n
 * Versión: 1.4
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";
import { type EvaluationReadinessIssue } from "@/features/evaluation/domain/services/evaluation-readiness";

export class EvaluationNotFoundError extends DomainError {
  public constructor() {
    super("Evaluation not found", "evaluation.evaluation_not_found");
  }
}

export class EvaluationScenarioNotFoundError extends DomainError {
  public constructor() {
    super("The scenario does not belong to this evaluation", "evaluation.scenario_not_found");
  }
}

export class EvaluationQuestionNotFoundError extends DomainError {
  public constructor() {
    super("The question does not belong to this evaluation", "evaluation.question_not_found");
  }
}

export class EvaluationQuestionOptionNotFoundError extends DomainError {
  public constructor() {
    super("The option does not belong to this question", "evaluation.option_not_found");
  }
}

export class EvaluationManagementForbiddenError extends DomainError {
  public constructor() {
    super("You are not allowed to manage this evaluation", "evaluation.management_forbidden");
  }
}

export class EvaluationHasSubmittedAttemptsError extends DomainError {
  public constructor() {
    super("The evaluation already has submitted attempts, so its structure cannot change", "evaluation.has_submitted_attempts");
  }
}

export class EvaluationNotReadyError extends DomainError {
  public readonly issues: ReadonlyArray<EvaluationReadinessIssue>;

  public constructor(issues: ReadonlyArray<EvaluationReadinessIssue>) {
    super(
      `The evaluation is not ready: ${issues.map((issue: EvaluationReadinessIssue) => (issue.questionId ? `${issue.code}(${issue.questionId})` : issue.code)).join(", ")}`,
      "evaluation.not_ready",
    );
    this.issues = issues;
  }
}

export class InvalidEvaluationStatusTransitionError extends DomainError {
  public constructor(from: string, to: string) {
    super(`The evaluation cannot change from ${from} to ${to}`, "evaluation.invalid_status_transition");
  }
}

export class EvaluationOptionsNotAllowedError extends DomainError {
  public constructor() {
    super("Only choice questions have options", "evaluation.options_not_allowed");
  }
}

export class InvalidEvaluationReorderError extends DomainError {
  public constructor() {
    super("The reorder must list distinct items that belong to this evaluation", "evaluation.invalid_reorder");
  }
}

export class InvalidEvaluationRichTextError extends DomainError {
  public constructor(reason: string) {
    super(`Invalid rich text content: ${reason}`, "evaluation.invalid_rich_text");
  }
}

export class EvaluationMediaNotFoundError extends DomainError {
  public constructor(mediaIds: ReadonlyArray<string>) {
    super(`Unknown media: ${mediaIds.join(", ")}`, "evaluation.media_not_found");
  }
}

export class EvaluationReferenceNotFoundError extends DomainError {
  public constructor(references: ReadonlyArray<string>) {
    super(`Unknown references: ${references.join(", ")}`, "evaluation.reference_not_found");
  }
}

export class EvaluationAssignmentNotFoundError extends DomainError {
  public constructor() {
    super("Evaluation assignment not found", "evaluation.assignment_not_found");
  }
}

export class EvaluationAssignmentForbiddenError extends DomainError {
  public constructor() {
    super("You are not allowed to manage assignments for this group", "evaluation.assignment_forbidden");
  }
}

export class EvaluationNotActivatableError extends DomainError {
  public constructor(status: string) {
    super(`Only READY evaluations can be activated (current status: ${status})`, "evaluation.not_activatable");
  }
}

export class InvalidEvaluationAssignmentGroupError extends DomainError {
  public constructor(groupIds: ReadonlyArray<string>) {
    super(`Target groups must exist, be STUDENT groups and be active: ${groupIds.join(", ")}`, "evaluation.assignment_group_invalid");
  }
}

export type EvaluationAssignmentWindowIssue = "starts_at_not_before_ends_at" | "ends_at_not_in_future" | "starts_at_locked";

export class InvalidEvaluationAssignmentWindowError extends DomainError {
  public readonly issue: EvaluationAssignmentWindowIssue;

  public constructor(issue: EvaluationAssignmentWindowIssue) {
    super(`Invalid assignment window: ${issue}`, "evaluation.assignment_window_invalid");
    this.issue = issue;
  }
}

export class EvaluationAlreadyAssignedError extends DomainError {
  public constructor(groupId: string) {
    super(`The evaluation already has an assignment for group ${groupId} with an overlapping window`, "evaluation.assignment_overlap");
  }
}

export class EvaluationAssignmentClosedError extends DomainError {
  public constructor() {
    super("The assignment is already closed", "evaluation.assignment_closed");
  }
}

export class EvaluationAssignmentHasAttemptsError extends DomainError {
  public constructor() {
    super("The assignment already has attempts, so it cannot be deleted", "evaluation.assignment_has_attempts");
  }
}

export class EvaluationNotOpenError extends DomainError {
  public constructor() {
    super("The evaluation is not open for attempts right now", "evaluation.not_open");
  }
}

export class MaxAttemptsReachedError extends DomainError {
  public constructor(maxAttempts: number) {
    super(`The maximum number of attempts (${maxAttempts}) has been reached`, "evaluation.max_attempts_reached");
  }
}

export class AttemptDeadlinePassedError extends DomainError {
  public constructor() {
    super("The attempt deadline has passed, so the attempt was closed with the saved answers", "evaluation.attempt_deadline_passed");
  }
}

export class EvaluationAttemptNotFoundError extends DomainError {
  public constructor() {
    super("Evaluation attempt not found", "evaluation.attempt_not_found");
  }
}

export class EvaluationAttemptNotInProgressError extends DomainError {
  public constructor() {
    super("The attempt was already submitted", "evaluation.attempt_not_in_progress");
  }
}

export class EvaluationAttemptReadOnlyError extends DomainError {
  public constructor() {
    super("Migrated attempts are read-only", "evaluation.attempt_read_only");
  }
}

export class EvaluationGradingForbiddenError extends DomainError {
  public constructor() {
    super("You cannot grade attempts of this student group", "evaluation.grading_forbidden");
  }
}

export class EvaluationAttemptNotGradableError extends DomainError {
  public constructor() {
    super("The attempt is still in progress, so it cannot be graded yet", "evaluation.attempt_not_gradable");
  }
}

export class EvaluationAttemptNotGradedError extends DomainError {
  public constructor() {
    super("Only fully graded attempts can be published", "evaluation.attempt_not_graded");
  }
}

export class InvalidManualScoreError extends DomainError {
  public constructor(maxPoints: number) {
    super(`The manual score must be between 0 and ${maxPoints}`, "evaluation.manual_score_invalid");
  }
}

export class GradeOverrideCommentRequiredError extends DomainError {
  public constructor() {
    super("Overriding an existing score requires a comment", "evaluation.grade_override_comment_required");
  }
}

export type InvalidEvaluationAnswerReason =
  | "option_count_invalid"
  | "option_duplicated"
  | "option_not_in_question"
  | "text_required"
  | "text_too_long"
  | "session_required"
  | "session_not_owned"
  | "fields_not_allowed";

export class InvalidEvaluationAnswerError extends DomainError {
  public readonly reason: InvalidEvaluationAnswerReason;

  public constructor(reason: InvalidEvaluationAnswerReason) {
    super(`Invalid answer: ${reason}`, "evaluation.answer_invalid");
    this.reason = reason;
  }
}

export class GradeFeedbackNotAvailableError extends DomainError {
  public constructor() {
    super("Feedback is available once the grade is published", "evaluation.grade_feedback_not_available");
  }
}

export class GradeFeedbackAttemptNotGradedError extends DomainError {
  public constructor() {
    super("Feedback can only be generated for a graded attempt", "evaluation.grade_feedback_attempt_not_graded");
  }
}

export class GradeFeedbackForbiddenError extends DomainError {
  public constructor() {
    super("You are not allowed to review this attempt", "evaluation.grade_feedback_forbidden");
  }
}
