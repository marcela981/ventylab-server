/*
 * Funcionalidad: Mapper de persistencia de comandos del ventilador
 * Descripción: Convierte entre la fila ventilator_commands y la entidad VentilatorCommand (parámetros en JSON, nulos de la base a undefined del dominio y viceversa)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type VentilatorCommand as VentilatorCommandModel } from "@prisma/client";

import { type CommandEncodingValue } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

export class VentilatorCommandsMapper {
  public static toDomain(row: VentilatorCommandModel): VentilatorCommand {
    return VentilatorCommand.reconstitute({
      id: row.id,
      reservationId: row.reservationId,
      userId: row.userId,
      params: row.params as unknown as VentilatorCommandParams,
      encoding: row.encoding as CommandEncodingValue,
      encodedPayload: row.encodedPayload,
      status: row.status,
      rejectReason: row.rejectReason ?? undefined,
      sentAt: row.sentAt ?? undefined,
      resolvedAt: row.resolvedAt ?? undefined,
      latencyMs: row.latencyMs ?? undefined,
      createdAt: row.createdAt,
    });
  }

  public static toPersistence(command: VentilatorCommand): Prisma.VentilatorCommandUncheckedCreateInput {
    return {
      id: command.id,
      reservationId: command.reservationId,
      userId: command.userId,
      params: { ...command.params },
      encoding: command.encoding,
      encodedPayload: command.encodedPayload,
      status: command.status,
      rejectReason: command.rejectReason ?? null,
      sentAt: command.sentAt ?? null,
      resolvedAt: command.resolvedAt ?? null,
      latencyMs: command.latencyMs ?? null,
      createdAt: command.createdAt,
    };
  }
}
