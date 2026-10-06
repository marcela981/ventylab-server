/*
 * Funcionalidad: Generador de señales fisiológicas
 * Descripción: Calcula presión, flujo y volumen en cada instante del ciclo respiratorio (fases inspiración, pausa y espiración, ecuación del movimiento, ruido gaussiano) y la SpO2 con retardo de primer orden según FiO2 y condición del paciente
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PatientConditionValue, type PatientModel, type RespiratoryMechanics } from "@/features/simulation/domain/value-objects/patient-model";
import { SIMV_MODE_VALUE, VCV_MODE_VALUE, type VentilationModeValue, type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";

export interface GeneratedSignals {
  pressure: number;
  flow: number;
  volume: number;
  timestamp: number;
}

type CyclePhaseName = "INSPIRATION" | "INSPIRATORY_PAUSE" | "EXPIRATION";

interface CyclePhase {
  phase: CyclePhaseName;
  phaseTime: number;
  phaseDuration: number;
}

const INSPIRATORY_PAUSE_MS: number = 100;
const SPO2_TIME_CONSTANT_MS: number = 30_000;

export function generateSignals(patient: PatientModel, ventSettings: VentilatorCommand, cycleTimeMs: number): GeneratedSignals {
  const cycleDuration: number = getCycleDuration(ventSettings.respiratoryRate);
  const normalizedTime: number = cycleTimeMs % cycleDuration;
  const phase: CyclePhase = getCurrentPhase(normalizedTime, ventSettings, cycleDuration);

  const flow: number = calculateFlow(phase, ventSettings, patient.respiratoryMechanics);
  const volume: number = calculateVolume(phase, ventSettings);
  const pressure: number = calculatePressure(volume, flow, patient.respiratoryMechanics, ventSettings.peep);

  return {
    pressure: addNoise(pressure, 0.5),
    flow: addNoise(flow, 1),
    volume: addNoise(volume, 5),
    timestamp: Date.now(),
  };
}

export function generateSpO2(patient: PatientModel, fio2: number, previousSpo2: number, deltaTimeMs: number): number {
  const targetSpo2: number = calculateTargetSpO2(fio2, patient.condition);
  const alpha: number = 1 - Math.exp(-deltaTimeMs / SPO2_TIME_CONSTANT_MS);
  const newSpo2: number = previousSpo2 + alpha * (targetSpo2 - previousSpo2);

  return Math.min(100, Math.max(50, newSpo2));
}

function getCycleDuration(respiratoryRate: number): number {
  return (60 / respiratoryRate) * 1000;
}

function getCurrentPhase(timeInCycle: number, settings: VentilatorCommand, cycleDuration: number): CyclePhase {
  const inspiratoryTime: number = (settings.inspiratoryTime ?? 1.0) * 1000;
  const pauseEnd: number = inspiratoryTime + INSPIRATORY_PAUSE_MS;

  if (timeInCycle < inspiratoryTime) {
    return { phase: "INSPIRATION", phaseTime: timeInCycle, phaseDuration: inspiratoryTime };
  }

  if (timeInCycle < pauseEnd) {
    return { phase: "INSPIRATORY_PAUSE", phaseTime: timeInCycle - inspiratoryTime, phaseDuration: INSPIRATORY_PAUSE_MS };
  }

  return { phase: "EXPIRATION", phaseTime: timeInCycle - pauseEnd, phaseDuration: cycleDuration - pauseEnd };
}

function calculateFlow(phase: CyclePhase, settings: VentilatorCommand, mechanics: RespiratoryMechanics): number {
  switch (phase.phase) {
    case "INSPIRATION":
      return calculateInspiratoryFlow(phase, settings, settings.mode);
    case "INSPIRATORY_PAUSE":
      return 0;
    case "EXPIRATION":
      return calculateExpiratoryFlow(phase, settings, mechanics);
  }
}

function calculateInspiratoryFlow(phase: CyclePhase, settings: VentilatorCommand, mode: VentilationModeValue): number {
  const tidalVolume: number = settings.tidalVolume;
  const inspiratoryTimeSec: number = phase.phaseDuration / 1000;

  if (mode === VCV_MODE_VALUE || mode === SIMV_MODE_VALUE) {
    return (tidalVolume / 1000) / (inspiratoryTimeSec / 60);
  }

  const progress: number = phase.phaseTime / phase.phaseDuration;
  const peakFlow: number = (tidalVolume / 1000) / (inspiratoryTimeSec / 60) * 1.5;
  const tau: number = 0.3;

  return peakFlow * Math.exp(-progress / tau);
}

function calculateExpiratoryFlow(phase: CyclePhase, settings: VentilatorCommand, mechanics: RespiratoryMechanics): number {
  const progress: number = phase.phaseTime / phase.phaseDuration;
  const tidalVolume: number = settings.tidalVolume;
  const expiratoryTimeSec: number = phase.phaseDuration / 1000;
  const tau: number = (mechanics.compliance / 1000) * mechanics.resistance;
  const tauNormalized: number = tau / expiratoryTimeSec;
  const peakExpFlow: number = -(tidalVolume / 1000) / (expiratoryTimeSec / 60) * 1.5;

  return peakExpFlow * Math.exp(-progress / Math.max(tauNormalized, 0.2));
}

function calculateVolume(phase: CyclePhase, settings: VentilatorCommand): number {
  const progress: number = phase.phaseTime / phase.phaseDuration;
  const tidalVolume: number = settings.tidalVolume;

  switch (phase.phase) {
    case "INSPIRATION":
      return tidalVolume * progress;
    case "INSPIRATORY_PAUSE":
      return tidalVolume;
    case "EXPIRATION":
      return Math.max(0, tidalVolume * (1 - progress));
  }
}

function calculatePressure(volume: number, flow: number, mechanics: RespiratoryMechanics, peep: number): number {
  const { compliance, resistance, intrinsicPeep } = mechanics;
  const elasticPressure: number = volume / compliance;
  const flowLs: number = flow / 60;
  const resistivePressure: number = flowLs * resistance;
  const totalPeep: number = peep + intrinsicPeep;

  return elasticPressure + resistivePressure + totalPeep;
}

function addNoise(value: number, stdDev: number): number {
  const u1: number = Math.max(Math.random(), Number.EPSILON);
  const u2: number = Math.random();
  const z: number = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  return value + z * stdDev;
}

function calculateTargetSpO2(fio2: number, condition: PatientConditionValue): number {
  let baseSpo2: number = 88 + (fio2 - 0.21) * 15;

  if (condition.includes("SEVERE")) {
    baseSpo2 -= 10;
  } else if (condition.includes("MODERATE")) {
    baseSpo2 -= 5;
  }

  return Math.min(100, Math.max(70, baseSpo2));
}
