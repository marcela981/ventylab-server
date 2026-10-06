/*
 * Funcionalidad: Sesiones de paciente simulado
 * Descripción: Mantiene en memoria el paciente configurado de cada usuario y su ciclo de generación de señales (~30 Hz) que emite `ventilator:data` solo a ese usuario por IRealtimePublisher; actualiza SpO2 cada segundo y detiene todos los ciclos al apagar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type IRealtimePublisher, REALTIME_PUBLISHER_TOKEN } from "@/common/application/ports/realtime-publisher.interface";
import { VENTILATOR_DATA_EVENT } from "@/features/simulation/application/realtime/ventilator-realtime-events";
import { type GeneratedSignals, generateSignals, generateSpO2 } from "@/features/simulation/domain/services/signal-generator";
import { PatientNotConfiguredError } from "@/features/simulation/domain/simulation.errors";
import { type PatientModel } from "@/features/simulation/domain/value-objects/patient-model";
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";
import { type VentilatorReading } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

interface PatientSimulationSession {
  patient: PatientModel;
  ventSettings: VentilatorCommand | null;
  intervalId: ReturnType<typeof setInterval> | null;
  startedAt: number;
  lastSpo2: number;
  tickCount: number;
}

const TICK_MS: number = 33;
const SPO2_UPDATE_TICKS: number = 30;
const SIMULATED_DEVICE_PREFIX: string = "simulated";

@Injectable()
export class PatientSimulationSessionsService {
  private readonly _sessions: Map<string, PatientSimulationSession> = new Map<string, PatientSimulationSession>();

  public constructor(
    @Inject(REALTIME_PUBLISHER_TOKEN)
    private readonly _realtimePublisher: IRealtimePublisher,
  ) {}

  public configure(userId: string, patient: PatientModel): void {
    const existing: PatientSimulationSession | undefined = this._sessions.get(userId);

    if (existing?.intervalId !== null && existing?.intervalId !== undefined) {
      clearInterval(existing.intervalId);
    }

    this._sessions.set(userId, {
      patient,
      ventSettings: existing?.ventSettings ?? null,
      intervalId: null,
      startedAt: Date.now(),
      lastSpo2: patient.vitalSigns.spo2,
      tickCount: 0,
    });
  }

  public start(userId: string, command: VentilatorCommand): void {
    const session: PatientSimulationSession | undefined = this._sessions.get(userId);

    if (!session) {
      throw new PatientNotConfiguredError();
    }

    if (session.intervalId !== null) {
      clearInterval(session.intervalId);
    }

    session.ventSettings = command;
    session.startedAt = Date.now();
    session.tickCount = 0;

    const deviceId: string = `${SIMULATED_DEVICE_PREFIX}-${userId}`;

    session.intervalId = setInterval((): void => {
      this._tick(userId, session, deviceId);
    }, TICK_MS);
  }

  public updateCommand(userId: string, command: VentilatorCommand): void {
    const session: PatientSimulationSession | undefined = this._sessions.get(userId);

    if (session) {
      session.ventSettings = command;
    }
  }

  public stop(userId: string): void {
    const session: PatientSimulationSession | undefined = this._sessions.get(userId);

    if (session && session.intervalId !== null) {
      clearInterval(session.intervalId);
      session.intervalId = null;
    }
  }

  public getActivePatient(userId: string): PatientModel | undefined {
    return this._sessions.get(userId)?.patient;
  }

  public isSimulating(userId: string): boolean {
    const session: PatientSimulationSession | undefined = this._sessions.get(userId);

    return session?.intervalId !== null && session?.intervalId !== undefined;
  }

  public stopAll(): void {
    for (const session of this._sessions.values()) {
      if (session.intervalId !== null) {
        clearInterval(session.intervalId);
      }
    }

    this._sessions.clear();
  }

  private _tick(userId: string, session: PatientSimulationSession, deviceId: string): void {
    const { patient, ventSettings } = session;

    if (!ventSettings) {
      return;
    }

    const elapsed: number = Date.now() - session.startedAt;
    const signals: GeneratedSignals = generateSignals(patient, ventSettings, elapsed);

    session.tickCount++;

    if (session.tickCount % SPO2_UPDATE_TICKS === 0) {
      session.lastSpo2 = generateSpO2(patient, ventSettings.fio2, session.lastSpo2, SPO2_UPDATE_TICKS * TICK_MS);
    }

    const reading: VentilatorReading = {
      pressure: signals.pressure,
      flow: signals.flow,
      volume: signals.volume,
      spo2: session.lastSpo2,
      timestamp: signals.timestamp,
      deviceId,
    };

    this._realtimePublisher.emitToUser(userId, VENTILATOR_DATA_EVENT, reading);
  }
}
