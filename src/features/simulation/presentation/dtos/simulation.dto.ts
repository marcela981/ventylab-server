/*
 * Funcionalidad: DTOs de respuesta de simulación
 * Descripción: Serializan el estado del ventilador y sus alarmas, el resultado de un comando, la reserva, las sesiones del simulador y la salud del módulo (MQTT, WebSocket, telemetría y reserva)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class VentilatorAlarmDTO {
  @ApiProperty({ description: "Alarm type", example: "HIGH_PRESSURE" })
  public type: string;

  @ApiProperty({ description: "Alarm severity", example: "HIGH" })
  public severity: string;

  @ApiProperty({ description: "Alarm message", example: "[HIGH] High airway pressure detected" })
  public message: string;

  @ApiProperty({ description: "Measured value, when reported", example: null, nullable: true, type: Number })
  public currentValue: number | null;

  @ApiProperty({ description: "Threshold value, when reported", example: null, nullable: true, type: Number })
  public thresholdValue: number | null;

  @ApiProperty({ description: "Alarm time (ms epoch)", example: 1767225600000 })
  public timestamp: number;

  @ApiProperty({ description: "Whether the alarm is active", example: true })
  public active: boolean;

  @ApiProperty({ description: "Whether the alarm was acknowledged", example: false })
  public acknowledged: boolean;

  public constructor({
    type,
    severity,
    message,
    currentValue,
    thresholdValue,
    timestamp,
    active,
    acknowledged,
  }: {
    type: string;
    severity: string;
    message: string;
    currentValue: number | null;
    thresholdValue: number | null;
    timestamp: number;
    active: boolean;
    acknowledged: boolean;
  }) {
    this.type = type;
    this.severity = severity;
    this.message = message;
    this.currentValue = currentValue;
    this.thresholdValue = thresholdValue;
    this.timestamp = timestamp;
    this.active = active;
    this.acknowledged = acknowledged;
  }
}

export class VentilatorStatusDTO {
  @ApiProperty({ description: "MQTT connection status", example: "CONNECTED" })
  public status: string;

  @ApiProperty({ description: "Device ID", example: "ventilab-device-001" })
  public deviceId: string;

  @ApiProperty({ description: "Whether the ventilator has an active reservation", example: true })
  public isReserved: boolean;

  @ApiProperty({ description: "Active reservation ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", nullable: true, type: String })
  public reservationId: string | null;

  @ApiProperty({ description: "User holding the reservation", example: "cm5user01", nullable: true, type: String })
  public currentUser: string | null;

  @ApiProperty({ description: "Name, or email, of the reservation holder", example: "Ana Pérez", nullable: true, type: String })
  public currentUserName: string | null;

  @ApiProperty({ description: "Group of the reservation", example: null, nullable: true, type: String })
  public groupId: string | null;

  @ApiProperty({ description: "User who receives the telemetry", example: null, nullable: true, type: String })
  public leaderId: string | null;

  @ApiProperty({ description: "Reservation end (ms epoch)", example: 1767227400000, nullable: true, type: Number })
  public reservationEndsAt: number | null;

  @ApiProperty({ description: "Last valid telemetry frame (ms epoch)", example: 1767225600000, nullable: true, type: Number })
  public lastDataTimestamp: number | null;

  @ApiProperty({ description: "Active alarms", type: VentilatorAlarmDTO, isArray: true })
  public activeAlarms: VentilatorAlarmDTO[];

  public constructor({
    status,
    deviceId,
    isReserved,
    reservationId,
    currentUser,
    currentUserName,
    groupId,
    leaderId,
    reservationEndsAt,
    lastDataTimestamp,
    activeAlarms,
  }: {
    status: string;
    deviceId: string;
    isReserved: boolean;
    reservationId: string | null;
    currentUser: string | null;
    currentUserName: string | null;
    groupId: string | null;
    leaderId: string | null;
    reservationEndsAt: number | null;
    lastDataTimestamp: number | null;
    activeAlarms: VentilatorAlarmDTO[];
  }) {
    this.status = status;
    this.deviceId = deviceId;
    this.isReserved = isReserved;
    this.reservationId = reservationId;
    this.currentUser = currentUser;
    this.currentUserName = currentUserName;
    this.groupId = groupId;
    this.leaderId = leaderId;
    this.reservationEndsAt = reservationEndsAt;
    this.lastDataTimestamp = lastDataTimestamp;
    this.activeAlarms = activeAlarms;
  }
}

export class CommandResultDTO {
  @ApiProperty({ description: "Command ID", example: "cmd-1767225600000" })
  public commandId: string;

  @ApiProperty({ description: "Who received the command", enum: ["synthetic_update", "synthetic_start", "physical"], example: "physical" })
  public target: string;

  @ApiProperty({ description: "Acceptance time (ms epoch)", example: 1767225600000 })
  public timestamp: number;

  public constructor({ commandId, target, timestamp }: { commandId: string; target: string; timestamp: number }) {
    this.commandId = commandId;
    this.target = target;
    this.timestamp = timestamp;
  }
}

export class ReservationDTO {
  @ApiProperty({ description: "Reservation ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public reservationId: string;

  @ApiProperty({ description: "Reservation start (ms epoch)", example: 1767225600000 })
  public startTime: number;

  @ApiProperty({ description: "Reservation end (ms epoch)", example: 1767227400000 })
  public endTime: number;

  @ApiProperty({ description: "true when the caller already held the active reservation", example: false })
  public recovered: boolean;

  public constructor({ reservationId, startTime, endTime, recovered }: { reservationId: string; startTime: number; endTime: number; recovered: boolean }) {
    this.reservationId = reservationId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.recovered = recovered;
  }
}

export class SimulatorSessionIdDTO {
  @ApiProperty({ description: "Session ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class SimulatorSessionDTO {
  @ApiProperty({ description: "Session ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Owner user ID", example: "cm5user01" })
  public userId: string;

  @ApiProperty({ description: "Related clinical case ID", example: null, nullable: true, type: String })
  public clinicalCaseId: string | null;

  @ApiProperty({ description: "true for the physical ventilator", example: false })
  public isRealVentilator: boolean;

  @ApiProperty({ description: "Commands applied during the session", type: [Object] })
  public parametersLog: unknown[];

  @ApiProperty({ description: "Readings recorded during the session", type: [Object] })
  public ventilatorData: unknown[];

  @ApiProperty({ description: "Session notes", example: null, nullable: true, type: String })
  public notes: string | null;

  @ApiProperty({ description: "Start time", example: "2026-01-01T00:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "Completion time", example: null, nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor({
    id,
    userId,
    clinicalCaseId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    startedAt,
    completedAt,
  }: {
    id: string;
    userId: string;
    clinicalCaseId: string | null;
    isRealVentilator: boolean;
    parametersLog: unknown[];
    ventilatorData: unknown[];
    notes: string | null;
    startedAt: Date;
    completedAt: Date | null;
  }) {
    this.id = id;
    this.userId = userId;
    this.clinicalCaseId = clinicalCaseId;
    this.isRealVentilator = isRealVentilator;
    this.parametersLog = parametersLog;
    this.ventilatorData = ventilatorData;
    this.notes = notes;
    this.startedAt = startedAt;
    this.completedAt = completedAt;
  }
}

export class MqttHealthDTO {
  @ApiProperty({ description: "MQTT connection status", example: "CONNECTED" })
  public status: string;

  @ApiProperty({ description: "Broker URL without credentials", example: "mqtt://test.mosquitto.org:1883" })
  public brokerUrl: string;

  @ApiProperty({ description: "Telemetry topic", example: "/ventynet/data" })
  public topic: string;

  public constructor({ status, brokerUrl, topic }: { status: string; brokerUrl: string; topic: string }) {
    this.status = status;
    this.brokerUrl = brokerUrl;
    this.topic = topic;
  }
}

export class RealtimeHealthDTO {
  @ApiProperty({ description: "Authenticated WebSocket users", example: 2 })
  public connectedUsers: number;

  @ApiProperty({ description: "Authenticated WebSocket user IDs", type: [String], example: ["cm5user01", "cm5user02"] })
  public userIds: string[];

  public constructor({ connectedUsers, userIds }: { connectedUsers: number; userIds: string[] }) {
    this.connectedUsers = connectedUsers;
    this.userIds = userIds;
  }
}

export class TelemetryHealthDTO {
  @ApiProperty({ description: "Last forwarded frame (ms epoch)", example: 1767225600000, nullable: true, type: Number })
  public lastFrameAt: number | null;

  @ApiProperty({ description: "Age of the last forwarded frame in ms", example: 20, nullable: true, type: Number })
  public lastFrameAgeMs: number | null;

  @ApiProperty({ description: "Frames forwarded in the last second", example: 30 })
  public framesPerSecond: number;

  public constructor({ lastFrameAt, lastFrameAgeMs, framesPerSecond }: { lastFrameAt: number | null; lastFrameAgeMs: number | null; framesPerSecond: number }) {
    this.lastFrameAt = lastFrameAt;
    this.lastFrameAgeMs = lastFrameAgeMs;
    this.framesPerSecond = framesPerSecond;
  }
}

export class ReservationHealthDTO {
  @ApiProperty({ description: "Whether the ventilator is reserved", example: false })
  public isReserved: boolean;

  @ApiProperty({ description: "User holding the reservation", example: null, nullable: true, type: String })
  public currentUser: string | null;

  @ApiProperty({ description: "Reservation end (ms epoch)", example: null, nullable: true, type: Number })
  public endsAt: number | null;

  public constructor({ isReserved, currentUser, endsAt }: { isReserved: boolean; currentUser: string | null; endsAt: number | null }) {
    this.isReserved = isReserved;
    this.currentUser = currentUser;
    this.endsAt = endsAt;
  }
}

export class SimulationHealthDTO {
  @ApiProperty({ description: "MQTT connection", type: MqttHealthDTO })
  public mqtt: MqttHealthDTO;

  @ApiProperty({ description: "WebSocket connections", type: RealtimeHealthDTO })
  public ws: RealtimeHealthDTO;

  @ApiProperty({ description: "Telemetry flow", type: TelemetryHealthDTO })
  public telemetry: TelemetryHealthDTO;

  @ApiProperty({ description: "Active reservation", type: ReservationHealthDTO })
  public reservation: ReservationHealthDTO;

  public constructor({
    mqtt,
    ws,
    telemetry,
    reservation,
  }: {
    mqtt: MqttHealthDTO;
    ws: RealtimeHealthDTO;
    telemetry: TelemetryHealthDTO;
    reservation: ReservationHealthDTO;
  }) {
    this.mqtt = mqtt;
    this.ws = ws;
    this.telemetry = telemetry;
    this.reservation = reservation;
  }
}
