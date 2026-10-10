/*
 * Funcionalidad: Política de acceso a reservas
 * Descripción: Decisiones puras sobre quién puede reservar para un titular, cancelar una reserva, desplazar la reserva de otro titular y controlar el ventilador durante la reserva activa, a partir del actor y de hechos ya resueltos sobre grupos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";
import { type ReservationPartyRole } from "@/features/reservations/domain/read-models/reservation.read-model";
import { type ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

export const STUDENT_ACTOR_ROLE: ReservationPartyRole = "STUDENT";
export const TEACHER_ACTOR_ROLE: ReservationPartyRole = "TEACHER";
export const ADMIN_ACTOR_ROLE: ReservationPartyRole = "ADMIN";

export interface ReservationActor {
  readonly userId: string;
  readonly role: ReservationPartyRole;
}

export interface HolderGroupFacts {
  readonly leadsGroup: boolean;
  readonly supervisesGroup: boolean;
  readonly isStudentGroup: boolean;
}

export function isPrivilegedActor(actor: ReservationActor): boolean {
  return actor.role === TEACHER_ACTOR_ROLE || actor.role === ADMIN_ACTOR_ROLE;
}

export function canReserveFor(actor: ReservationActor, holder: ReservationHolder, facts: HolderGroupFacts): boolean {
  if (actor.role === ADMIN_ACTOR_ROLE) {
    return true;
  }

  if (holder.isUser()) {
    return holder.userId === actor.userId;
  }

  if (!facts.isStudentGroup) {
    return false;
  }

  if (actor.role === TEACHER_ACTOR_ROLE) {
    return facts.supervisesGroup;
  }

  return facts.leadsGroup;
}

export function canCancel(actor: ReservationActor, reservation: Reservation, facts: HolderGroupFacts): boolean {
  if (actor.role === ADMIN_ACTOR_ROLE || reservation.createdById === actor.userId || reservation.holder.userId === actor.userId) {
    return true;
  }

  if (!reservation.holder.isGroup()) {
    return false;
  }

  return facts.leadsGroup || (actor.role === TEACHER_ACTOR_ROLE && facts.supervisesGroup);
}

export function canPreempt(actor: ReservationActor, holderRole: ReservationPartyRole): boolean {
  if (actor.role === ADMIN_ACTOR_ROLE) {
    return true;
  }

  return actor.role === TEACHER_ACTOR_ROLE && holderRole === STUDENT_ACTOR_ROLE;
}

export function toReservationPartyRole(role: string): ReservationPartyRole {
  if (role === ADMIN_ACTOR_ROLE || role === TEACHER_ACTOR_ROLE) {
    return role;
  }

  return STUDENT_ACTOR_ROLE;
}
