/*
 * Funcionalidad: Estado del comando del ventilador
 * Descripción: Estados del ciclo de vida de un comando (PENDING, SENT, ACKED, APPLIED, REJECTED, TIMEOUT), los terminales y las transiciones permitidas de la máquina de estados (un comando PENDING puede terminar en TIMEOUT cuando su publicación nunca se confirmó)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type VentilatorCommandStatusValue = "PENDING" | "SENT" | "ACKED" | "APPLIED" | "REJECTED" | "TIMEOUT";

export const PENDING_COMMAND_STATUS: VentilatorCommandStatusValue = "PENDING";
export const SENT_COMMAND_STATUS: VentilatorCommandStatusValue = "SENT";
export const ACKED_COMMAND_STATUS: VentilatorCommandStatusValue = "ACKED";
export const APPLIED_COMMAND_STATUS: VentilatorCommandStatusValue = "APPLIED";
export const REJECTED_COMMAND_STATUS: VentilatorCommandStatusValue = "REJECTED";
export const TIMEOUT_COMMAND_STATUS: VentilatorCommandStatusValue = "TIMEOUT";

export const VENTILATOR_COMMAND_STATUS_VALUES: readonly VentilatorCommandStatusValue[] = [
  PENDING_COMMAND_STATUS,
  SENT_COMMAND_STATUS,
  ACKED_COMMAND_STATUS,
  APPLIED_COMMAND_STATUS,
  REJECTED_COMMAND_STATUS,
  TIMEOUT_COMMAND_STATUS,
] as const;

export const TERMINAL_COMMAND_STATUSES: readonly VentilatorCommandStatusValue[] = [
  ACKED_COMMAND_STATUS,
  APPLIED_COMMAND_STATUS,
  REJECTED_COMMAND_STATUS,
  TIMEOUT_COMMAND_STATUS,
] as const;

export const ALLOWED_COMMAND_TRANSITIONS: Readonly<Record<VentilatorCommandStatusValue, readonly VentilatorCommandStatusValue[]>> = {
  PENDING: [SENT_COMMAND_STATUS, REJECTED_COMMAND_STATUS, TIMEOUT_COMMAND_STATUS],
  SENT: [ACKED_COMMAND_STATUS, APPLIED_COMMAND_STATUS, REJECTED_COMMAND_STATUS, TIMEOUT_COMMAND_STATUS],
  ACKED: [],
  APPLIED: [],
  REJECTED: [],
  TIMEOUT: [],
};

export function isTerminalCommandStatus(status: VentilatorCommandStatusValue): boolean {
  return TERMINAL_COMMAND_STATUSES.includes(status);
}
