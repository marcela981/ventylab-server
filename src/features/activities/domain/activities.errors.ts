/*
 * Funcionalidad: Errores de la feature de actividades
 * Descripción: Errores de dominio de actividades, asignaciones a grupos y entregas con sus claves i18n
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class ActivityNotFoundError extends DomainError {
  public constructor() {
    super("Activity not found", "activities.activity_not_found");
  }
}

export class ActivityNotOwnedError extends DomainError {
  public constructor() {
    super("Not authorized to manage this activity", "activities.activity_not_owned");
  }
}

export class ActivityAccessDeniedError extends DomainError {
  public constructor() {
    super("Access denied to this activity", "activities.activity_access_denied");
  }
}

export class ActivityNotAvailableError extends DomainError {
  public constructor() {
    super("Activity not available", "activities.activity_not_available");
  }
}

export class ActivityNotAssignedToGroupError extends DomainError {
  public constructor() {
    super("Activity not assigned to your group", "activities.activity_not_assigned_to_group");
  }
}

export class ActivityNotYetVisibleError extends DomainError {
  public constructor() {
    super("Activity not available yet", "activities.activity_not_yet_visible");
  }
}

export class ActivityGroupNotFoundError extends DomainError {
  public constructor() {
    super("Group not found", "activities.group_not_found");
  }
}

export class ActivityAssignmentNotFoundError extends DomainError {
  public constructor() {
    super("Assignment not found", "activities.assignment_not_found");
  }
}

export class ActivityAssignmentNotOwnedError extends DomainError {
  public constructor() {
    super("Not authorized to remove this assignment", "activities.assignment_not_owned");
  }
}

export class ActivitySubmissionNotFoundError extends DomainError {
  public constructor() {
    super("Submission not found", "activities.submission_not_found");
  }
}

export class ActivitySubmissionNotOwnedError extends DomainError {
  public constructor() {
    super("Not authorized for this submission", "activities.submission_not_owned");
  }
}

export class ActivitySubmissionAlreadyCompletedError extends DomainError {
  public constructor() {
    super("Activity already completed", "activities.submission_already_completed");
  }
}

export class ActivitySubmissionNotSubmittedError extends DomainError {
  public constructor() {
    super("Submission has not been submitted yet", "activities.submission_not_submitted");
  }
}

export class InvalidActivitySubmissionScoreError extends DomainError {
  public constructor() {
    super("Score must be between 0 and the submission maximum score", "activities.submission_score_invalid");
  }
}

export class StudentRoleRequiredError extends DomainError {
  public constructor() {
    super("Only students can perform this action on submissions", "activities.student_role_required");
  }
}
