/*
 * Funcionalidad: Objeto de valor UserRole
 * Descripción: Valida y representa los roles STUDENT, TEACHER y ADMIN
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";

export type UserRoleValue = "STUDENT" | "TEACHER" | "ADMIN";

export const STUDENT_ROLE_VALUE: UserRoleValue = "STUDENT";
export const TEACHER_ROLE_VALUE: UserRoleValue = "TEACHER";
export const ADMIN_ROLE_VALUE: UserRoleValue = "ADMIN";

export const USER_ROLE_VALUES: readonly UserRoleValue[] = [
  STUDENT_ROLE_VALUE,
  TEACHER_ROLE_VALUE,
  ADMIN_ROLE_VALUE,
] as const;

export class UserRole {
  private readonly _value: UserRoleValue;

  private constructor(value: UserRoleValue) {
    this._value = value;
  }

  public get value(): UserRoleValue {
    return this._value;
  }

  public static create(value: string): UserRole {
    if (!USER_ROLE_VALUES.includes(value as UserRoleValue)) {
      throw new InvalidValueObjectError("UserRole", value);
    }

    return new UserRole(value as UserRoleValue);
  }

  public static student(): UserRole {
    return new UserRole(STUDENT_ROLE_VALUE);
  }

  public static admin(): UserRole {
    return new UserRole(ADMIN_ROLE_VALUE);
  }

  public isStudent(): boolean {
    return this._value === STUDENT_ROLE_VALUE;
  }

  public isTeacher(): boolean {
    return this._value === TEACHER_ROLE_VALUE;
  }

  public isAdmin(): boolean {
    return this._value === ADMIN_ROLE_VALUE;
  }

  public equals(other: UserRole): boolean {
    return this._value === other._value;
  }
}
