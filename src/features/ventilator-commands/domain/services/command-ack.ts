/*
 * Funcionalidad: Acuse de recibo de comandos del ventilador
 * Descripción: Interpreta el mensaje JSON del tópico de acuses (commandId o correlationId, status applied|rejected|pending y reason opcional) según el esquema de diseño ventilator-command-ack; devuelve undefined ante cualquier mensaje mal formado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type CommandAckStatusValue = "applied" | "rejected" | "pending";

export const COMMAND_ACK_STATUS_VALUES: readonly CommandAckStatusValue[] = ["applied", "rejected", "pending"] as const;

export interface CommandAck {
  readonly commandId: string;
  readonly status: CommandAckStatusValue;
  readonly reason?: string;
}

export function parseCommandAck(payload: Buffer | string): CommandAck | undefined {
  let parsed: unknown;

  try {
    parsed = JSON.parse(typeof payload === "string" ? payload : payload.toString("utf8"));
  } catch {
    return undefined;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return undefined;
  }

  const record: Record<string, unknown> = parsed as Record<string, unknown>;
  const commandId: unknown = record.commandId ?? record.correlationId;
  const status: unknown = record.status;

  if (typeof commandId !== "string" || commandId.length === 0 || typeof status !== "string" || !COMMAND_ACK_STATUS_VALUES.includes(status as CommandAckStatusValue)) {
    return undefined;
  }

  return {
    commandId,
    status: status as CommandAckStatusValue,
    reason: typeof record.reason === "string" ? record.reason : undefined,
  };
}
