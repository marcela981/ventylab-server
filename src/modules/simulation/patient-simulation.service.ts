/**
 * @module PatientSimulationService
 * @description Orquesta la simulación fisiológica de pacientes.
 *
 * Conecta el formulario de paciente con el loop de generación de señales:
 *   1. configurePatient() → construye PatientModel (con IBW, mecánica resp.)
 *   2. startSimulation()  → inicia loop a 20 Hz, emite 'ventilator:data' por WS
 *   3. stopSimulation()   → detiene el loop
 *
 * Cada usuario tiene su propia sesión independiente en el Map de sesiones.
 * Los datos emitidos usan el mismo evento 'ventilator:data' que el ventilador
 * físico, por lo que el frontend funciona sin cambios adicionales.
 */

import { PatientCalculatorService } from './patient/patient-calculator.service';
import { SignalGeneratorService } from './patient/signal-generator.service';
import { ClinicalCasesService } from './patient/clinical-cases.service';
import type { PatientModel, PatientCondition, VitalSigns } from './patient/patient.types';
import type { ISimulationGateway, VentilatorCommand } from '../../../contracts/simulation.contracts';

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

interface ConfigurePatientBody {
  /** Carga un caso clínico predefinido por su ID */
  clinicalCaseId?: string;
  /** Datos demográficos del paciente (alternativa a clinicalCaseId) */
  demographics?: {
    name?: string;
    weight: number;
    height: number;
    age: number;
    gender: 'M' | 'F';
  };
  condition?: PatientCondition;
  vitalSigns?: Partial<VitalSigns>;
  diagnosis?: string;
  difficultyLevel?: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
}

interface SimulationSession {
  patient: PatientModel;
  ventSettings: VentilatorCommand | null;
  intervalId: ReturnType<typeof setInterval> | null;
  startedAt: number;
  /** Último valor de SpO2 — se actualiza lentamente (primer orden) */
  lastSpo2: number;
  /** Contador de ticks para actualizar SpO2 cada 1 s a 20 Hz */
  tickCount: number;
}

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Intervalo entre muestras en ms (20 Hz) */
const TICK_MS = 50;

/** Cada cuántos ticks se recalcula SpO2 (1 s = 20 ticks a 20 Hz) */
const SPO2_UPDATE_TICKS = 20;

const SIMULATED_DEVICE_PREFIX = 'simulated';

// ---------------------------------------------------------------------------
// Servicio
// ---------------------------------------------------------------------------

export class PatientSimulationService {
  private readonly sessions = new Map<string, SimulationSession>();

  constructor(
    private readonly calculator: PatientCalculatorService,
    private readonly signalGenerator: SignalGeneratorService,
    private readonly clinicalCasesService: ClinicalCasesService,
    private readonly gateway: ISimulationGateway,
  ) {}

  // -------------------------------------------------------------------------
  // Configuración del paciente
  // -------------------------------------------------------------------------

  /**
   * Configura el modelo de paciente para un usuario.
   * Si se provee `clinicalCaseId`, carga el caso predefinido.
   * Si se proveen `demographics` + `condition`, construye el modelo desde cero.
   * Siempre calcula automáticamente: IBW, BMI, BSA y mecánica respiratoria.
   *
   * @returns PatientModel completo
   * @throws Error si faltan datos requeridos
   */
  configurePatient(userId: string, body: ConfigurePatientBody): PatientModel {
    let patient: PatientModel;

    if (body.clinicalCaseId) {
      // Caso clínico predefinido — todo calculado por el servicio de casos
      patient = this.clinicalCasesService.createPatientFromCase(body.clinicalCaseId);
    } else {
      // Construcción desde formulario
      const { demographics, condition, vitalSigns, diagnosis, difficultyLevel } = body;

      if (!demographics || !condition) {
        throw new Error('Se requiere demographics + condition cuando no se usa clinicalCaseId');
      }

      const calculated = this.calculator.calculatePatientParams(demographics);
      const baseMechanics = this.calculator.getRespiratoryMechanics(condition);
      const adjustedMechanics = this.calculator.adjustMechanicsForDemographics(
        baseMechanics,
        demographics,
      );

      patient = {
        id: this.generateId(),
        demographics,
        calculated,
        respiratoryMechanics: adjustedMechanics,
        condition,
        vitalSigns: {
          heartRate: vitalSigns?.heartRate ?? 80,
          respiratoryRate: vitalSigns?.respiratoryRate ?? 14,
          spo2: vitalSigns?.spo2 ?? 95,
          systolicBP: vitalSigns?.systolicBP ?? 120,
          diastolicBP: vitalSigns?.diastolicBP ?? 75,
          temperature: vitalSigns?.temperature ?? 36.5,
        },
        diagnosis,
        difficultyLevel: difficultyLevel ?? 'BASIC',
        createdAt: Date.now(),
      };
    }

    // Conservar ventSettings si ya había sesión activa
    const existing = this.sessions.get(userId);
    const session: SimulationSession = {
      patient,
      ventSettings: existing?.ventSettings ?? null,
      intervalId: null,
      startedAt: Date.now(),
      lastSpo2: patient.vitalSigns.spo2,
      tickCount: 0,
    };

    // Detener loop anterior si existía
    if (existing?.intervalId !== null && existing?.intervalId !== undefined) {
      clearInterval(existing.intervalId);
    }

    this.sessions.set(userId, session);
    console.log(`[PatientSimulationService] Patient configured for user ${userId}: ${patient.condition}`);
    return patient;
  }

  // -------------------------------------------------------------------------
  // Control de la simulación
  // -------------------------------------------------------------------------

  /**
   * Inicia la generación de señales fisiológicas para el usuario.
   * Si había una simulación en curso, la detiene primero.
   *
   * @param command - Configuración inicial del ventilador
   * @throws Error si el paciente no está configurado
   */
  startSimulation(userId: string, command: VentilatorCommand): void {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error(`No hay paciente configurado para el usuario ${userId}`);
    }

    // Detener loop previo
    if (session.intervalId !== null) {
      clearInterval(session.intervalId);
    }

    session.ventSettings = command;
    session.startedAt = Date.now();
    session.tickCount = 0;

    const deviceId = `${SIMULATED_DEVICE_PREFIX}-${userId}`;

    session.intervalId = setInterval(() => {
      const elapsed = Date.now() - session.startedAt;
      const { patient, ventSettings } = session;

      if (!ventSettings) return;

      const signals = this.signalGenerator.generateSignals(patient, ventSettings, elapsed);

      // Actualizar SpO2 cada segundo (cada SPO2_UPDATE_TICKS ticks)
      session.tickCount++;
      if (session.tickCount % SPO2_UPDATE_TICKS === 0) {
        session.lastSpo2 = this.signalGenerator.generateSpO2(
          patient,
          ventSettings.fio2,
          session.lastSpo2,
          SPO2_UPDATE_TICKS * TICK_MS,
        );
      }

      const reading = {
        pressure: signals.pressure,
        flow: signals.flow,
        volume: signals.volume,
        spo2: session.lastSpo2,
        timestamp: signals.timestamp,
        deviceId,
      };

      this.gateway.broadcastData('ventilator:data', reading);
    }, TICK_MS);

    this.sessions.set(userId, session);
    console.log(`[PatientSimulationService] Simulation started for user ${userId}`);
  }

  /**
   * Detiene la generación de señales del usuario.
   * No-op si no hay simulación activa.
   */
  stopSimulation(userId: string): void {
    const session = this.sessions.get(userId);
    if (!session) return;

    if (session.intervalId !== null) {
      clearInterval(session.intervalId);
      session.intervalId = null;
    }

    console.log(`[PatientSimulationService] Simulation stopped for user ${userId}`);
  }

  // -------------------------------------------------------------------------
  // Consultas
  // -------------------------------------------------------------------------

  /**
   * Devuelve el modelo de paciente activo o null si no hay sesión.
   */
  getActivePatient(userId: string): PatientModel | null {
    return this.sessions.get(userId)?.patient ?? null;
  }

  /**
   * Indica si hay una simulación en curso para el usuario.
   */
  isSimulating(userId: string): boolean {
    const session = this.sessions.get(userId);
    return session?.intervalId !== null && session?.intervalId !== undefined;
  }

  // -------------------------------------------------------------------------
  // Limpieza
  // -------------------------------------------------------------------------

  /**
   * Detiene todas las simulaciones activas (llamar en shutdown del servidor).
   */
  stopAll(): void {
    for (const [userId, session] of this.sessions) {
      if (session.intervalId !== null) {
        clearInterval(session.intervalId);
        console.log(`[PatientSimulationService] Stopped simulation for user ${userId} (shutdown)`);
      }
    }
    this.sessions.clear();
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private generateId(): string {
    return `patient-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }
}
