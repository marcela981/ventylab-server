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

  constructor(
    private readonly prisma: PrismaClient,
    private readonly gateway: ISimulationGateway,
    private readonly ventilatorConnection: IVentilatorConnection,
    private readonly hexParser: IHexParser,
    private readonly hexEncoder: IHexEncoder,
  ) { }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Inicializa el servicio: conecta MQTT y suscribe a telemetría.
   * Debe llamarse una vez al iniciar el servidor.
   */
  async initialize(): Promise<void> {
    await this.ventilatorConnection.connect();
    this.ventilatorConnection.subscribeTelemetry((data: Buffer) => {
      this.handleTelemetryBuffer(data);
    });
    console.log('[SimulationService] Initialized and subscribed to telemetry');
  }

  /**
   * Detiene el servicio: desconecta MQTT y limpia recursos.
   */
  async shutdown(): Promise<void> {
    await this.ventilatorConnection.disconnect();
    this.activeAlarms.clear();
    this.lastDataTimestamp = null;
    console.log('[SimulationService] Shut down');
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
    this.gateway.broadcastData('ventilator:data', reading);
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
      },
    });

    this.gateway.broadcastData('ventilator:reserved', {
      userId: request.userId,
      reservationId: reservation.id,
      endTime: endTime.getTime(),
    });

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

    this.gateway.broadcastData('ventilator:released', { userId });
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
