/*
 * Funcionalidad: Errores de usuarios
 * Descripción: Errores de dominio de usuarios: inexistencia, duplicados, contraseñas, acceso a estudiantes y restricciones de cambio de rol y de estado de cuenta (incluida la inmutabilidad del superadmin)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class UserNotFoundError extends DomainError {
  public constructor() {
    super("User not found", "users.user_not_found");
  }
}

export class UserAlreadyExistsError extends DomainError {
  public constructor(email: string) {
    super(`User with email ${email} already exists`, "users.user_already_exists");
  }
}

export class InvalidCurrentPasswordError extends DomainError {
  public constructor() {
    super("Current password is incorrect", "users.invalid_current_password");
  }
}

export class PasswordNotSetError extends DomainError {
  public constructor() {
    super("User has no password because it signed up with an external provider", "users.password_not_set");
  }
}

export class SamePasswordError extends DomainError {
  public constructor() {
    super("New password must be different from the current password", "users.same_password");
  }
}

export class UserNotStudentError extends DomainError {
  public constructor() {
    super("User is not a student", "users.user_not_student");
  }
}

export class StudentAccessDeniedError extends DomainError {
  public constructor() {
    super("Student is not assigned to the requesting teacher", "users.student_access_denied");
  }
}

export class CannotChangeOwnRoleError extends DomainError {
  public constructor() {
    super("Users cannot change their own role", "users.cannot_change_own_role");
  }
}

export class SuperadminRoleImmutableError extends DomainError {
  public constructor() {
    super("The superadmin role cannot be changed", "users.superadmin_role_immutable");
  }
}

export class SuperadminStatusImmutableError extends DomainError {
  public constructor() {
    super("The superadmin account cannot be deactivated", "users.superadmin_status_immutable");
  }
}

export class CannotChangeOwnStatusError extends DomainError {
  public constructor() {
    super("Users cannot change their own account status", "users.cannot_change_own_status");
  }
}
