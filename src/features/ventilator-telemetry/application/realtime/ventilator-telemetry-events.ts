/*
 * Funcionalidad: Eventos en tiempo real de la telemetría del ventilador
 * Descripción: Nombres de los eventos Socket.io de la telemetría (lote ventilator:telemetry, alarma, disponibilidad, rechazo de unión, conexión y desconexión del dispositivo), del mensaje entrante ventilator:join y la forma de sus cargas
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";

export const VENTILATOR_TELEMETRY_EVENT: string = "ventilator:telemetry";
export const VENTILATOR_ALARM_EVENT: string = "ventilator:alarm";
export const VENTILATOR_AVAILABILITY_EVENT: string = "ventilator:availability";
export const VENTILATOR_JOIN_REJECTED_EVENT: string = "ventilator:join-rejected";
export const VENTILATOR_CONNECTED_EVENT: string = "ventilator:connected";
export const VENTILATOR_DISCONNECTED_EVENT: string = "ventilator:disconnected";

export const VENTILATOR_JOIN_MESSAGE: string = "ventilator:join";

export const TELEMETRY_PRIVILEGED_ROLES: readonly string[] = ["TEACHER", "ADMIN"] as const;

export interface VentilatorTelemetryBatchPayload {
  readonly frames: readonly TelemetryFrame[];
  readonly serverTs: number;
}

export interface VentilatorAvailabilityPayload {
  readonly occupied: boolean;
  readonly startsAt?: string;
  readonly endsAt?: string;
}

export type VentilatorJoinRejectedReason = "no_active_reservation" | "not_reservation_holder";

export interface VentilatorJoinRejectedPayload {
  readonly reason: VentilatorJoinRejectedReason;
}

export type VentilatorDisconnectedReason = "device_stale" | "broker_disconnected";

export interface VentilatorConnectionPayload {
  readonly at: number;
  readonly reason?: VentilatorDisconnectedReason;
}

export function isPrivilegedTelemetryRole(role: string): boolean {
  return TELEMETRY_PRIVILEGED_ROLES.includes(role);
}
