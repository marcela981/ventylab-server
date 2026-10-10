/*
 * Funcionalidad: Eventos en tiempo real de los comandos del ventilador
 * Descripción: Nombres y cargas de ventilator:control-changed y ventilator:command-status, el mensaje entrante ventilator:heartbeat y la audiencia (sala ventilator, docentes y administradores; solo el usuario afectado, docentes y administradores cuando la sala ya pertenece a otra reserva)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { roleRoom, userRoom, VENTILATOR_ROOM } from "@/common/application/ports/realtime-publisher.interface";
import { VENTILATOR_PRIVILEGED_ROLES } from "@/features/ventilator-commands/domain/services/operator-control-policy";
import { type VentilatorCommandStatusValue } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-status";

export const VENTILATOR_CONTROL_CHANGED_EVENT: string = "ventilator:control-changed";
export const VENTILATOR_COMMAND_STATUS_EVENT: string = "ventilator:command-status";
export const VENTILATOR_HEARTBEAT_MESSAGE: string = "ventilator:heartbeat";

export const VENTILATOR_COMMANDS_AUDIENCE: readonly string[] = [VENTILATOR_ROOM, ...VENTILATOR_PRIVILEGED_ROLES.map(roleRoom)];

// Once the ventilator room is rebuilt for the next reservation, a late event of the previous one must not reach the new holders
export function ventilatorCommandsAudience(reservationId: string, roomReservationId: string | undefined, userId: string): readonly string[] {
  if (reservationId === roomReservationId) {
    return VENTILATOR_COMMANDS_AUDIENCE;
  }

  return [userRoom(userId), ...VENTILATOR_PRIVILEGED_ROLES.map(roleRoom)];
}

export type VentilatorControlChangeReason = "taken" | "takeover" | "released" | "presence_timeout" | "reservation_ended" | "reservation_preempted";

export interface VentilatorControlChangedPayload {
  readonly reservationId: string;
  readonly operatorUserId: string | null;
  readonly reason: VentilatorControlChangeReason;
}

export interface VentilatorCommandStatusPayload {
  readonly commandId: string;
  readonly reservationId: string;
  readonly userId: string;
  readonly status: VentilatorCommandStatusValue;
  readonly sentAt?: string;
  readonly resolvedAt?: string;
  readonly latencyMs?: number;
  readonly reason?: string;
}
