/*
 * Funcionalidad: Errores de dominio de relaciones profesor-estudiante
 * Descripción: Errores de la feature teacher-students (relación inexistente, relación duplicada y usuario sin rol de profesor) con sus claves i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class TeacherStudentNotFoundError extends DomainError {
  public constructor() {
    super("Teacher-student relationship not found", "teacher-students.relationship_not_found");
  }
}

export class TeacherStudentAlreadyExistsError extends DomainError {
  public constructor() {
    super("The student is already assigned to this teacher", "teacher-students.relationship_already_exists");
  }
}

export class TeacherRoleRequiredError extends DomainError {
  public constructor() {
    super("The user must have the TEACHER or ADMIN role", "teacher-students.teacher_role_required");
  }
}
