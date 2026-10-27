/*
 * Funcionalidad: Vista de la reserva
 * Descripción: Reserva enriquecida con los datos del usuario titular, del grupo titular y del creador, y el rol efectivo del titular (rol del usuario, o STUDENT/TEACHER según el tipo del grupo), que usan la presentación por rol y la decisión de desplazamiento; el código de estudiante de cada usuario y la relación de quien consulta con una reserva
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";

export type ReservationPartyRole = "STUDENT" | "TEACHER" | "ADMIN";

/** How the viewer relates to a reservation: its holder user, the leader or a member of its holder group, its creator, or none */
export type ReservationRelation = "holder" | "group_leader" | "group_member" | "creator" | "none";

export const RESERVATION_RELATION_VALUES: readonly ReservationRelation[] = ["holder", "group_leader", "group_member", "creator", "none"] as const;

export interface ReservationUserView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly role: ReservationPartyRole;
  /** Student code (User.studentCode); only staff projections expose it */
  readonly code?: string;
}

export interface ReservationGroupView {
  readonly id: string;
  readonly name: string;
}

export interface ReservationView {
  readonly reservation: Reservation;
  readonly holderUser?: ReservationUserView;
  readonly holderGroup?: ReservationGroupView;
  readonly creator?: ReservationUserView;
  readonly holderRole: ReservationPartyRole;
}

export interface ReservationViewer {
  readonly userId: string;
  readonly role: ReservationPartyRole;
  readonly groupIds: readonly string[];
}
