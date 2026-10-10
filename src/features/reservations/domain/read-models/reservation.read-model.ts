/*
 * Funcionalidad: Vista de la reserva
 * Descripción: Reserva enriquecida con los datos del usuario titular, del grupo titular y del creador, y el rol efectivo del titular (rol del usuario, o STUDENT/TEACHER según el tipo del grupo), que usan la presentación por rol y la decisión de desplazamiento
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Reservation } from "@/features/reservations/domain/entities/reservation.entity";

export type ReservationPartyRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface ReservationUserView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
  readonly role: ReservationPartyRole;
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
