/*
 * Funcionalidad: Política de gestión de grupos
 * Descripción: Reglas puras de alcance por rol: ADMIN crea, gestiona y lee todo; TEACHER crea grupos STUDENT y gestiona los que creó o que supervisa un grupo TEACHER al que pertenece, y lee además los grupos TEACHER de los que es miembro; STUDENT no gestiona y solo lee su propio grupo STUDENT
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { STUDENT_GROUP_TYPE, TEACHER_GROUP_TYPE, type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";

export const ADMIN_ACTOR_ROLE: string = "ADMIN";
export const TEACHER_ACTOR_ROLE: string = "TEACHER";
export const STUDENT_ACTOR_ROLE: string = "STUDENT";

export interface GroupActor {
  readonly id: string;
  readonly role: string;
}

export interface ManagedGroup {
  readonly type: GroupTypeValue;
  readonly createdBy?: string;
}

export interface GroupManagementContext {
  readonly supervisedByActor: boolean;
}

export interface GroupReadContext {
  readonly canManage: boolean;
  readonly isMember: boolean;
}

export function isAdminActor(actor: GroupActor): boolean {
  return actor.role === ADMIN_ACTOR_ROLE;
}

export function isTeacherActor(actor: GroupActor): boolean {
  return actor.role === TEACHER_ACTOR_ROLE;
}

export function canCreateGroup(actor: GroupActor, type: GroupTypeValue): boolean {
  if (isAdminActor(actor)) {
    return true;
  }

  return isTeacherActor(actor) && type === STUDENT_GROUP_TYPE;
}

export function canManageGroup(actor: GroupActor, group: ManagedGroup, context: GroupManagementContext): boolean {
  if (isAdminActor(actor)) {
    return true;
  }

  if (!isTeacherActor(actor) || group.type !== STUDENT_GROUP_TYPE) {
    return false;
  }

  return group.createdBy === actor.id || context.supervisedByActor;
}

export function canReadGroup(actor: GroupActor, group: ManagedGroup, context: GroupReadContext): boolean {
  if (isAdminActor(actor)) {
    return true;
  }

  if (isTeacherActor(actor)) {
    return context.canManage || (group.type === TEACHER_GROUP_TYPE && context.isMember);
  }

  return group.type === STUDENT_GROUP_TYPE && context.isMember;
}
