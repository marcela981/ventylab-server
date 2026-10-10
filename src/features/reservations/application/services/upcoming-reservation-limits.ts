/*
 * Funcionalidad: Límites de reservas futuras
 * Descripción: Comprueba, dentro de la transacción que ya tiene el bloqueo del dispositivo, que un estudiante no supere RESERVATION_MAX_FUTURE_PER_STUDENT reservas futuras propias ni su grupo RESERVATION_MAX_FUTURE_PER_GROUP; docentes y administradores quedan exentos. Lo comparten la creación programada y la reserva inmediata heredada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";
import { type IReservationsRepository } from "@/features/reservations/domain/repositories/reservations.repository";
import { type ReservationActor, STUDENT_ACTOR_ROLE } from "@/features/reservations/domain/services/reservation-access-policy";
import { assertBelowUpcomingLimit } from "@/features/reservations/domain/services/reservation-scheduling-rules";
import { type ReservationHolder } from "@/features/reservations/domain/value-objects/reservation-holder";

export type UpcomingReservationLimits = Pick<ReservationSettings, "maxUpcomingPerStudent" | "maxUpcomingPerGroup">;

export async function assertWithinUpcomingReservationLimits(
  repository: IReservationsRepository,
  limits: UpcomingReservationLimits,
  actor: ReservationActor,
  holder: ReservationHolder,
  now: Date,
  transaction: unknown,
): Promise<void> {
  if (actor.role !== STUDENT_ACTOR_ROLE) {
    return;
  }

  const userCount: number = await repository.countUpcomingScheduledOfUser(actor.userId, now, transaction);

  assertBelowUpcomingLimit(userCount, limits.maxUpcomingPerStudent);

  if (holder.groupId !== undefined) {
    const groupCount: number = await repository.countUpcomingScheduledOfGroup(holder.groupId, now, transaction);

    assertBelowUpcomingLimit(groupCount, limits.maxUpcomingPerGroup);
  }
}
