/*
 * Funcionalidad: Mapper de presentación de los comandos del ventilador
 * Descripción: Convierte el cuerpo tipado en parámetros sin validar para el dominio y los resultados y entidades en DTOs de respuesta con fechas ISO 8601, nulos explícitos y la hora de envío omitida cuando la publicación no se confirmó; incluye el nombre proyectado del operador
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SentVentilatorCommandResult, type VentilatorControlStateResult } from "@/features/ventilator-commands/application/results/ventilator-commands.results";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";
import { type SendVentilatorCommandRequestDTO } from "@/features/ventilator-commands/presentation/dtos/ventilator-command-request.dto";
import { SentVentilatorCommandDTO, VentilatorCommandDTO, type VentilatorControlStateDetails, VentilatorControlStateDTO } from "@/features/ventilator-commands/presentation/dtos/ventilator-command.dto";

export class VentilatorCommandsMapper {
  public static toParams(dto: SendVentilatorCommandRequestDTO): Record<string, unknown> {
    return {
      mode: dto.mode,
      tidalVolume: dto.tidalVolume,
      respiratoryRate: dto.respiratoryRate,
      peep: dto.peep,
      fio2: dto.fio2,
      pressureLimit: dto.pressureLimit,
      inspiratoryTime: dto.inspiratoryTime,
      ieRatio: dto.ieRatio,
      flowRate: dto.flowRate,
      sensitivity: dto.sensitivity,
    };
  }

  public static toSentDTO(result: SentVentilatorCommandResult): SentVentilatorCommandDTO {
    return new SentVentilatorCommandDTO({ commandId: result.commandId, reservationId: result.reservationId, status: result.status, sentAt: result.sentAt?.toISOString() });
  }

  public static toControlStateDTO(result: VentilatorControlStateResult): VentilatorControlStateDTO {
    return new VentilatorControlStateDTO({
      isOperator: result.isOperator,
      canTake: result.canTake,
      canTakeover: result.canTakeover,
      occupied: result.occupied,
      details: result.restricted ? undefined : VentilatorCommandsMapper._toControlDetails(result),
    });
  }

  public static toCommandDTO(command: VentilatorCommand): VentilatorCommandDTO {
    return new VentilatorCommandDTO({
      id: command.id,
      reservationId: command.reservationId,
      userId: command.userId,
      params: { ...command.params },
      encoding: command.encoding,
      status: command.status,
      rejectReason: command.rejectReason ?? null,
      sentAt: command.sentAt?.toISOString() ?? null,
      resolvedAt: command.resolvedAt?.toISOString() ?? null,
      latencyMs: command.latencyMs ?? null,
      createdAt: command.createdAt.toISOString(),
    });
  }

  private static _toControlDetails(result: VentilatorControlStateResult): VentilatorControlStateDetails {
    return {
      reservationId: result.reservationId ?? null,
      operatorUserId: result.operatorUserId ?? null,
      operatorName: result.operatorName ?? null,
      operatorLabelKey: result.operatorLabelKey ?? null,
      since: result.since?.toISOString() ?? null,
      lastSeenAt: result.lastSeenAt?.toISOString() ?? null,
      presenceExpiresAt: result.presenceExpiresAt?.toISOString() ?? null,
    };
  }
}
