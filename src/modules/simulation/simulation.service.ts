/**
 * @module SimulationService
 * @description Orquestador principal del módulo de simulación.
 * Coordina la comunicación entre el cliente MQTT (Node-RED/ventilador físico),
 * el parser/encoder hexadecimal, y el gateway WebSocket hacia el frontend.
 *
 * Responsabilidades:
 * - Iniciar/detener sesiones de simulación
 * - Recibir telemetría del ventilador y reenviarla a clientes WebSocket
 * - Procesar comandos del frontend y enviarlos al ventilador
 * - Gestionar reservas del ventilador físico
 * - Persistir sesiones de simulación en BD
 */

import type { PrismaClient } from '@prisma/client';
import {
  type VentilatorReading,
  type VentilatorAlarm,
  type ISimulationGateway,
  type IVentilatorConnection,
  type IHexParser,
  type IHexEncoder,
  type SendCommandRequest,
  type SendCommandResponse,
  type ReserveVentilatorRequest,
  type ReserveVentilatorResponse,
  type GetVentilatorStatusResponse,
  type SaveSimulatorSessionRequest,
  type SaveSimulatorSessionResponse,
  type HexPressureData,
  type HexFlowData,
  type HexVolumeData,
  type HexAlarmData,
  HexMessageType,
} from '../../../contracts/simulation.contracts';

import type { SimulationHealth } from './simulation.health';
import { SIMULATION_CONFIG } from './simulation.config';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEVICE_ID = 'ventilab-device-001';

const ALARM_MESSAGES: Record<string, string> = {
  HIGH_PRESSURE: 'High airway pressure detected',
  LOW_PRESSURE: 'Low airway pressure detected',
  HIGH_VOLUME: 'Tidal volume too high',
  LOW_VOLUME: 'Tidal volume too low',
  APNEA: 'Apnea detected – no breaths detected',
  DISCONNECTION: 'Patient circuit disconnection detected',
  POWER_FAILURE: 'Power failure detected',
  TECHNICAL_FAULT: 'Technical fault – device malfunction',
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class SimulationService {
  /** Timestamp (ms) of the last successfully parsed telemetry frame. */
  private lastDataTimestamp: number | null = null;

  /** Active alarms keyed by AlarmType string. */
  private readonly activeAlarms = new Map<string, VentilatorAlarm>();

  /**
   * Rolling composite of the most recent readings of each type.
   * Updated incrementally as individual frames arrive.
   */
  private readonly currentReading = { pressure: 0, flow: 0, volume: 0 };

  /** In-memory reservation state, kept in sync with DB writes. */
  private reservationSnapshot: { isReserved: boolean; currentUser?: string; endsAt?: number } = {
    isReserved: false,
  };

  /**
   * Throttle: last time (ms) a ventilator:data frame was forwarded per recipient.
   * Key is userId or '__broadcast__'.
   */
  private readonly lastSentAt = new Map<string, number>();

  /** Minimum ms between frames forwarded to the same recipient. */
  private readonly throttleIntervalMs: number;

  /** In-memory mirror of the currently active reservation.
   *  Read on every frame (zero DB hits). Written only on reserve/release/expire. */
  private activeReservationCache: {
    userId: string;
    leaderId: string | null;
    groupId: string | null;
    reservationId: string;
    endTime: number; // ms epoch
  } | null = null;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly gateway: ISimulationGateway,
    private readonly ventilatorConnection: IVentilatorConnection,
    private readonly hexParser: IHexParser,
    private readonly hexEncoder: IHexEncoder,
    private readonly health?: SimulationHealth,
    throttleIntervalMs?: number,
  ) {
    this.throttleIntervalMs = throttleIntervalMs ?? (1000 / SIMULATION_CONFIG.WS_MAX_HZ);
  }

  /** Returns the in-memory reservation snapshot (no DB query). */
  getReservationSnapshot(): { isReserved: boolean; currentUser?: string; endsAt?: number } {
    return { ...this.reservationSnapshot };
  }

  /** Fetches the active reservation from DB and writes it to the in-memory cache. */
  private async refreshReservationCache(): Promise<void> {
    const db = this.prisma as any;
    const active = await db.ventilatorReservation.findFirst({
      where: { status: 'ACTIVE', deviceId: DEVICE_ID },
      select: { id: true, userId: true, leaderId: true, groupId: true, endTime: true },
    });
    this.activeReservationCache = active
      ? {
          userId: active.userId,
          leaderId: active.leaderId ?? null,
          groupId: active.groupId ?? null,
          reservationId: active.id,
          endTime: active.endTime instanceof Date
            ? active.endTime.getTime()
            : Number(active.endTime ?? Date.now() + 30 * 60_000),
        }
      : null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Inicializa el servicio: conecta MQTT y suscribe a telemetría.
   * Debe llamarse una vez al iniciar el servidor.
   *
   * EXCEPCIÓN TEMPORAL: El hardware envía JSON en lugar de trama hex.
   * Se bypasea el HexParser y se parsea el payload directamente como JSON.
   * Cuando el hardware implemente el protocolo hex, restaurar la línea:
   *   this.ventilatorConnection.subscribeTelemetry(buf => this.handleTelemetryBuffer(buf));
   */
  async initialize(): Promise<void> {
    await this.ventilatorConnection.connect();
    this.ventilatorConnection.subscribeTelemetry((data: Buffer) => {
      this.handleTelemetryJson(data);
    });
    await this.refreshReservationCache();
  }

  /**
   * Detiene el servicio: desconecta MQTT y limpia recursos.
   */
  async shutdown(): Promise<void> {
    await this.ventilatorConnection.disconnect();
    this.activeAlarms.clear();
    this.lastDataTimestamp = null;
  }

  // ---------------------------------------------------------------------------
  // Telemetry processing
  // ---------------------------------------------------------------------------

  /**
   * Procesa un buffer crudo recibido por MQTT.
   * Parsea el hex, valida, y emite al gateway WebSocket.
   * @param rawBuffer - Buffer crudo desde MQTT
   */
  handleTelemetryBuffer(rawBuffer: Buffer): void {
    if (!this.hexParser.validate(rawBuffer)) {
      console.warn('[SimulationService] Invalid telemetry buffer, discarding');
      return;
    }

    const parsed = this.hexParser.parse(rawBuffer);
    if (!parsed) return;

    this.lastDataTimestamp = Date.now();

    // Alarm frames are broadcast separately and do not update the reading.
    if (parsed.type === HexMessageType.ALARM) {
      const alarmData = parsed as HexAlarmData;
      const alarm: VentilatorAlarm = {
        type: alarmData.alarmType,
        severity: alarmData.severity,
        message: `[${alarmData.severity}] ${ALARM_MESSAGES[alarmData.alarmType] ?? 'Unknown alarm'}`,
        timestamp: alarmData.timestamp,
        active: true,
        acknowledged: false,
      };
      this.activeAlarms.set(alarmData.alarmType, alarm);
      this.gateway.broadcastData('ventilator:alarm', alarm);
      return;
    }

    // Update the rolling reading state for the field that arrived.
    if (parsed.type === HexMessageType.PRESSURE) {
      this.currentReading.pressure = (parsed as HexPressureData).pressure;
    } else if (parsed.type === HexMessageType.FLOW) {
      this.currentReading.flow = (parsed as HexFlowData).flow;
    } else if (parsed.type === HexMessageType.VOLUME) {
      this.currentReading.volume = (parsed as HexVolumeData).volume;
    }

    const reading: VentilatorReading = {
      ...this.currentReading,
      timestamp: parsed.timestamp,
      deviceId: DEVICE_ID,
    };
    this.sendTelemetryToLeader(reading);
  }

  // ---------------------------------------------------------------------------
  // JSON telemetry handler (temporary bypass of HexParser)
  // ---------------------------------------------------------------------------

  /**
   * Parsea un buffer MQTT directamente como JSON y emite un VentilatorReading.
   *
   * Acepta el subconjunto mínimo { pressure, flow, volume } que envía el
   * hardware en las pruebas con broker público, y añade timestamp/deviceId
   * cuando no vienen en el payload.
   *
   * Errores de parseo o campos faltantes se loguean y descartan sin crashear.
   *
   * @param rawBuffer - Buffer crudo recibido por MQTT
   */
  private handleTelemetryJson(rawBuffer: Buffer): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBuffer.toString('utf-8'));
    } catch (err) {
      console.warn(
        '[SimulationService] JSON parse error – discarding frame:',
        err instanceof Error ? err.message : String(err),
      );
      return;
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as any).pressure !== 'number' ||
      typeof (parsed as any).flow !== 'number' ||
      typeof (parsed as any).volume !== 'number'
    ) {
      console.warn(
        '[SimulationService] Telemetry missing required fields (pressure/flow/volume) – discarding',
      );
      return;
    }

    const raw = parsed as {
      pressure: number;
      flow: number;
      volume: number;
      timestamp?: number;
      deviceId?: string;
      pco2?: number;
      spo2?: number;
    };

    const reading: VentilatorReading = {
      pressure: raw.pressure,
      flow: raw.flow,
      volume: raw.volume,
      ...(raw.pco2 !== undefined ? { pco2: raw.pco2 } : {}),
      ...(raw.spo2 !== undefined ? { spo2: raw.spo2 } : {}),
      timestamp: raw.timestamp ?? Date.now(),
      deviceId: raw.deviceId ?? DEVICE_ID,
    };

    this.lastDataTimestamp = Date.now();
    this.sendTelemetryToLeader(reading);
  }

  // ---------------------------------------------------------------------------
  // Telemetry routing: sends only to the active reservation leader
  // ---------------------------------------------------------------------------

  /**
   * Enruta la trama al destinatario correcto usando únicamente el caché en memoria.
   * Zero DB hits — la BD solo se consulta en reserve/release/expire/initialize.
   */
  private sendTelemetryToLeader(reading: VentilatorReading): void {
    const cache = this.activeReservationCache;

    // Auto-expire if cached reservation passed its endTime
    if (cache && cache.endTime < Date.now()) {
      this.activeReservationCache = null;
      void this.expireOverdueReservations();
    }

    if (!this.activeReservationCache) {
      if (this.isThrottled('__broadcast__')) return;
      this.markSent('__broadcast__');
      this.gateway.broadcastData('ventilator:data', reading);
      this.health?.recordFrame();
      return;
    }

    const recipientId = this.activeReservationCache.leaderId ?? this.activeReservationCache.userId;
    if (this.isThrottled(recipientId)) return;
    this.markSent(recipientId);
    this.gateway.sendToUser(recipientId, 'ventilator:data', reading);
    this.health?.recordFrame();
  }

  private isThrottled(key: string): boolean {
    const last = this.lastSentAt.get(key);
    return last !== undefined && Date.now() - last < this.throttleIntervalMs;
  }

  private markSent(key: string): void {
    this.lastSentAt.set(key, Date.now());
  }

  // ---------------------------------------------------------------------------
  // Commands
  // ---------------------------------------------------------------------------

  /**
   * Envía un comando al ventilador físico.
   * Valida parámetros, publica via MQTT.
   * @param request - Datos del comando
   * @returns Resultado del envío
   */
  async sendCommand(request: SendCommandRequest): Promise<SendCommandResponse> {
    const errors = this.hexEncoder.getValidationErrors(request.command);
    if (errors.length > 0) {
      return {
        success: false,
        message: 'Command validation failed',
        timestamp: Date.now(),
        errors,
      };
    }

    const cache = this.activeReservationCache;
    if (cache && request.userId) {
      const authorizedId = cache.leaderId ?? cache.userId;
      if (request.userId !== authorizedId) {
        return {
          success: false,
          message: 'Only the reservation leader can send commands',
          timestamp: Date.now(),
          errors: [`User ${request.userId} is not authorized (expected ${authorizedId})`],
        };
      }
    }

    await this.ventilatorConnection.publishCommand(request.command);

    return {
      success: true,
      message: 'Command sent successfully',
      timestamp: Date.now(),
      commandId: `cmd-${Date.now()}`,
    };
  }

  // ---------------------------------------------------------------------------
  // Reservations
  // ---------------------------------------------------------------------------

  /**
   * Marca como EXPIRED cualquier reserva ACTIVE cuyo endTime ya pasó.
   * Se llama automáticamente antes de consultar/crear reservas.
   */
  private async expireOverdueReservations(): Promise<void> {
    const db = this.prisma as any;
    await db.ventilatorReservation.updateMany({
      where: {
        status: 'ACTIVE',
        endTime: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    void this.refreshReservationCache();
  }

  /**
   * Reserva el ventilador físico para un usuario.
   * Solo un usuario puede tener reserva activa a la vez.
   * Si el mismo usuario ya tiene una reserva activa, se la devuelve.
   * @param request - Datos de la reserva
   * @returns Resultado de la reserva
   */
  async reserveVentilator(request: ReserveVentilatorRequest): Promise<ReserveVentilatorResponse> {
    const db = this.prisma as any;

    // Auto-expire overdue reservations first
    await this.expireOverdueReservations();

    const existing = await db.ventilatorReservation.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (existing) {
      // If the same user already holds the reservation, return it (recovery)
      if (existing.userId === request.userId) {
        return {
          success: true,
          reservationId: existing.id,
          startTime: existing.startTime.getTime(),
          endTime: existing.endTime.getTime(),
          message: 'Reservation recovered',
        };
      }

      return {
        success: false,
        message: 'Ventilator is already reserved',
        currentUser: existing.userId,
      };
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + request.durationMinutes * 60 * 1000);

    const reservation = await db.ventilatorReservation.create({
      data: {
        userId: request.userId,
        userRole: request.userRole ?? 'STUDENT',
        deviceId: DEVICE_ID,
        status: 'ACTIVE',
        durationMinutes: request.durationMinutes,
        startTime,
        endTime,
        purpose: request.purpose,
        groupId: (request as any).groupId ?? null,
        leaderId: (request as any).leaderId ?? null,
      },
    });

    // Notify ALL connected clients that the ventilator is now reserved
    // (so other teachers can see the "occupied" status)
    this.gateway.broadcastData('ventilator:reserved', {
      userId: request.userId,
      reservationId: reservation.id,
      groupId: (request as any).groupId ?? null,
      leaderId: (request as any).leaderId ?? null,
      endTime: endTime.getTime(),
    });

    this.reservationSnapshot = {
      isReserved: true,
      currentUser: request.userId,
      endsAt: endTime.getTime(),
    };

    await this.refreshReservationCache();

    return {
      success: true,
      reservationId: reservation.id,
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      message: 'Ventilator reserved successfully',
    };
  }

  /**
   * Libera la reserva activa del ventilador.
   * @param userId - ID del usuario que libera
   */
  async releaseVentilator(userId: string): Promise<void> {
    const db = this.prisma as any;
    const reservation = await db.ventilatorReservation.findFirst({
      where: { userId, status: 'ACTIVE' },
    });

    if (!reservation) {
      throw new Error(`No active reservation found for user ${userId}`);
    }

    await db.ventilatorReservation.update({
      where: { id: reservation.id },
      data: { status: 'COMPLETED', releasedAt: new Date() },
    });

    this.reservationSnapshot = { isReserved: false };
    this.gateway.broadcastData('ventilator:released', { userId });
    await this.refreshReservationCache();
  }

  // ---------------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------------

  /**
   * Obtiene el estado actual del ventilador.
   * @param deviceId - ID del dispositivo (opcional, usa el default si se omite)
   * @returns Estado completo del ventilador
   */
  async getVentilatorStatus(deviceId?: string): Promise<GetVentilatorStatusResponse> {
    const db = this.prisma as any;
    const status = this.ventilatorConnection.getStatus();
    const targetDeviceId = deviceId ?? DEVICE_ID;

    // Auto-expire overdue reservations before querying
    await this.expireOverdueReservations();

    const activeReservation = await db.ventilatorReservation.findFirst({
      where: { status: 'ACTIVE', deviceId: targetDeviceId },
    });

    return {
      status,
      deviceId: targetDeviceId,
      isReserved: !!activeReservation,
      reservationId: activeReservation?.id,
      currentUser: activeReservation?.userId,
      groupId: activeReservation?.groupId ?? null,
      leaderId: activeReservation?.leaderId ?? null,
      reservationEndsAt: activeReservation?.endTime?.getTime(),
      lastDataTimestamp: this.lastDataTimestamp ?? undefined,
      activeAlarms: Array.from(this.activeAlarms.values()),
    };
  }

  // ---------------------------------------------------------------------------
  // Session persistence
  // ---------------------------------------------------------------------------

  /**
   * Guarda una sesión de simulador en la base de datos.
   * @param request - Datos de la sesión
   * @returns Resultado del guardado
   */
  async saveSession(request: SaveSimulatorSessionRequest): Promise<SaveSimulatorSessionResponse> {
    const db = this.prisma as any;
    const session = await db.simulatorSession.create({
      data: {
        userId: request.userId,
        isRealVentilator: request.isRealVentilator,
        parametersLog: request.parametersLog,
        ventilatorData: request.ventilatorData,
        notes: request.notes ?? null,
        clinicalCaseId: request.clinicalCaseId ?? null,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      sessionId: session.id,
      message: 'Session saved successfully',
      timestamp: Date.now(),
    };
  }

  /**
   * Crea un nuevo registro de SimulatorSession al inicio de una sesión.
   *
   * Si isRealVentilator es false el servicio sólo persiste el registro y
   * devuelve el sessionId — el controlador se encarga de invocar al
   * PatientSimulationService (no se toca el MqttClient).
   *
   * Si isRealVentilator es true el registro también se crea aquí; la
   * conexión MQTT ya fue inicializada en initialize() al arrancar el servidor.
   *
   * @param request - Datos iniciales de la sesión
   * @returns sessionId + mensaje indicando el modo
   */
  async createSession(request: {
    userId: string;
    isRealVentilator: boolean;
    parametersLog?: unknown[];
    ventilatorData?: unknown[];
    notes?: string;
    clinicalCaseId?: string;
  }): Promise<{ success: boolean; sessionId: string; message: string; timestamp: number }> {
    const db = this.prisma as any;
    const session = await db.simulatorSession.create({
      data: {
        userId: request.userId,
        isRealVentilator: request.isRealVentilator,
        parametersLog: request.parametersLog ?? [],
        ventilatorData: request.ventilatorData ?? [],
        notes: request.notes ?? null,
        clinicalCaseId: request.clinicalCaseId ?? null,
      },
    });

    const message = request.isRealVentilator
      ? 'Session created – real ventilator mode'
      : 'Session created – simulated patient mode (no MQTT connection)';

    return { success: true, sessionId: session.id, message, timestamp: Date.now() };
  }

  /**
   * Obtiene sesiones de simulador de un usuario.
   * @param userId - ID del usuario
   * @param limit - Límite de resultados (opcional)
   */
  async getUserSessions(userId: string, limit?: number): Promise<any[]> {
    const db = this.prisma as any;
    return db.simulatorSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      ...(limit !== undefined ? { take: limit } : {}),
    });
  }
}
