/*
 * Funcionalidad: Mapper de presentación de simulación
 * Descripción: Convierte los resultados de los casos de uso de simulación (estado, comando, reserva, sesiones, salud) y del paciente simulado en DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ActivePatientResult } from "@/features/simulation/application/results/active-patient.result";
import { type ReserveVentilatorResult } from "@/features/simulation/application/results/reserve-ventilator.result";
import { type SendVentilatorCommandResult } from "@/features/simulation/application/results/send-ventilator-command.result";
import { type SimulationHealthResult } from "@/features/simulation/application/results/simulation-health.result";
import { type VentilatorStatusResult } from "@/features/simulation/application/results/ventilator-status.result";
import { type SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";
import { type PatientModel } from "@/features/simulation/domain/value-objects/patient-model";
import { type VentilatorAlarm } from "@/features/simulation/domain/value-objects/ventilator-telemetry";
import { ActivePatientDTO, PatientDTO } from "@/features/simulation/presentation/dtos/patient.dto";
import {
  CommandResultDTO,
  MqttHealthDTO,
  RealtimeHealthDTO,
  ReservationDTO,
  ReservationHealthDTO,
  SimulationHealthDTO,
  SimulatorSessionDTO,
  TelemetryHealthDTO,
  VentilatorAlarmDTO,
  VentilatorStatusDTO,
} from "@/features/simulation/presentation/dtos/simulation.dto";

export class SimulationMapper {
  public static toStatusDTO(result: VentilatorStatusResult): VentilatorStatusDTO {
    return new VentilatorStatusDTO({
      status: result.status,
      deviceId: result.deviceId,
      isReserved: result.isReserved,
      reservationId: result.reservationId ?? null,
      currentUser: result.currentUser ?? null,
      currentUserName: result.currentUserName ?? null,
      groupId: result.groupId ?? null,
      leaderId: result.leaderId ?? null,
      reservationEndsAt: result.reservationEndsAt ?? null,
      lastDataTimestamp: result.lastDataTimestamp ?? null,
      activeAlarms: result.activeAlarms.map((alarm: VentilatorAlarm) => SimulationMapper.toAlarmDTO(alarm)),
    });
  }

  public static toAlarmDTO(alarm: VentilatorAlarm): VentilatorAlarmDTO {
    return new VentilatorAlarmDTO({
      type: alarm.type,
      severity: alarm.severity,
      message: alarm.message,
      currentValue: alarm.currentValue ?? null,
      thresholdValue: alarm.thresholdValue ?? null,
      timestamp: alarm.timestamp,
      active: alarm.active,
      acknowledged: alarm.acknowledged,
    });
  }

  public static toCommandResultDTO(result: SendVentilatorCommandResult): CommandResultDTO {
    return new CommandResultDTO({ commandId: result.commandId, target: result.target, timestamp: result.timestamp });
  }

  public static toReservationDTO(result: ReserveVentilatorResult): ReservationDTO {
    return new ReservationDTO({
      reservationId: result.reservationId,
      startTime: result.startTime,
      endTime: result.endTime,
      recovered: result.recovered,
    });
  }

  public static toSessionDTO(session: SimulatorSession): SimulatorSessionDTO {
    return new SimulatorSessionDTO({
      id: session.id,
      userId: session.userId,
      clinicalCaseId: session.clinicalCaseId ?? null,
      isRealVentilator: session.isRealVentilator,
      parametersLog: [...session.parametersLog],
      ventilatorData: [...session.ventilatorData],
      notes: session.notes ?? null,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? null,
    });
  }

  public static toSessionDTOList(sessions: SimulatorSession[]): SimulatorSessionDTO[] {
    return sessions.map((session: SimulatorSession) => SimulationMapper.toSessionDTO(session));
  }

  public static toHealthDTO(result: SimulationHealthResult): SimulationHealthDTO {
    return new SimulationHealthDTO({
      mqtt: new MqttHealthDTO({ status: result.mqtt.status, brokerUrl: result.mqtt.brokerUrl, topic: result.mqtt.topic }),
      ws: new RealtimeHealthDTO({ connectedUsers: result.ws.connectedUsers, userIds: result.ws.userIds }),
      telemetry: new TelemetryHealthDTO({
        lastFrameAt: result.telemetry.lastFrameAt,
        lastFrameAgeMs: result.telemetry.lastFrameAgeMs,
        framesPerSecond: result.telemetry.framesPerSecond,
      }),
      reservation: new ReservationHealthDTO({
        isReserved: result.reservation.isReserved,
        currentUser: result.reservation.currentUser ?? null,
        endsAt: result.reservation.endsAt ?? null,
      }),
    });
  }

  public static toPatientDTO(patient: PatientModel): PatientDTO {
    return new PatientDTO({
      id: patient.id,
      demographics: patient.demographics,
      calculated: patient.calculated,
      respiratoryMechanics: patient.respiratoryMechanics,
      condition: patient.condition,
      vitalSigns: patient.vitalSigns,
      arterialBloodGas: patient.arterialBloodGas ?? null,
      physicalExam: patient.physicalExam ?? null,
      diagnosis: patient.diagnosis ?? null,
      difficultyLevel: patient.difficultyLevel,
      createdAt: patient.createdAt,
    });
  }

  public static toActivePatientDTO(result: ActivePatientResult): ActivePatientDTO {
    return new ActivePatientDTO({
      patient: result.patient ? SimulationMapper.toPatientDTO(result.patient) : null,
      isSimulating: result.isSimulating,
    });
  }
}
