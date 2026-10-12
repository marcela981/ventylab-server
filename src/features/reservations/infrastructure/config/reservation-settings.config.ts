/*
 * Funcionalidad: Configuración de reservas
 * Descripción: Lector puro de los ajustes de reservas desde ConfigService (duración máxima, granularidad de franja, días de antelación, máximo de reservas futuras por estudiante y por grupo e identificador del dispositivo), usado como valores por defecto de los ajustes de la plataforma
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";

import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { type ReservationSettings } from "@/features/reservations/application/tokens/reservation-settings.token";

export function readReservationSettings(configService: ConfigService<EnvironmentVariables, true>): ReservationSettings {
  return {
    maxDurationMinutes: configService.get("RESERVATION_MAX_DURATION_MINUTES", { infer: true }),
    slotMinutes: configService.get("RESERVATION_SLOT_MINUTES", { infer: true }),
    maxAdvanceDays: configService.get("RESERVATION_MAX_ADVANCE_DAYS", { infer: true }),
    maxUpcomingPerStudent: configService.get("RESERVATION_MAX_FUTURE_PER_STUDENT", { infer: true }),
    maxUpcomingPerGroup: configService.get("RESERVATION_MAX_FUTURE_PER_GROUP", { infer: true }),
    deviceId: configService.get("VENTILATOR_DEVICE_ID", { infer: true }),
  };
}
