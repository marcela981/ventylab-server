/*
 * Funcionalidad: Reglas de los eventos de una sesión de simulación
 * Descripción: Funciones puras que sanean los eventos enviados por el cliente (solo los campos conocidos de PARAM_CHANGE y ALARM_ACK; cualquier puntaje o métrica se descarta), validan los ajustes acumulados contra los límites del motor, exigen tiempo simulado no decreciente y no adelantado al tiempo real transcurrido por el multiplicador más la tolerancia, y convierten los eventos persistidos en eventos del motor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AlarmCode,
  type EngineEvent,
  EngineValidationError,
  resolveVentilatorSettings,
  validateVentilatorSettings,
  VENTILATOR_LIMITS,
  type VentilatorSettings,
} from "@/features/simulation/domain/engine";
import { type SimulationEventRecord } from "@/features/simulation/domain/read-models/simulation-session.read-model";
import {
  InvalidSimulationEventPayloadError,
  SimulationEventTimeAheadError,
  SimulationEventTimeNotMonotonicError,
  SimulationParameterOutOfRangeError,
} from "@/features/simulation/domain/simulation.errors";
import {
  ALARM_ACK_EVENT_TYPE,
  ALARM_CODE_VALUES,
  type ClientSimulationEventTypeValue,
  PARAM_CHANGE_EVENT_TYPE,
} from "@/features/simulation/domain/value-objects/simulation-session-values";

export interface ClientSimulationEvent {
  readonly id: string;
  readonly simTimeMs: number;
  readonly type: ClientSimulationEventTypeValue;
  readonly payload: unknown;
}

export interface SanitizedSimulationEvent {
  readonly id: string;
  readonly simTimeMs: number;
  readonly type: ClientSimulationEventTypeValue;
  readonly payload: Record<string, unknown>;
}

export interface SettingsChange {
  readonly simTimeMs: number;
  readonly changes: Partial<VentilatorSettings>;
  readonly previous: Partial<VentilatorSettings>;
}

type StringSettingKey = "mode" | "flowPattern" | "triggerType" | "simvMandatoryType";

const NUMERIC_SETTING_KEYS: readonly (keyof VentilatorSettings)[] = Object.keys(VENTILATOR_LIMITS) as (keyof VentilatorSettings)[];
const STRING_SETTING_KEYS: readonly StringSettingKey[] = ["mode", "flowPattern", "triggerType", "simvMandatoryType"];
const RANGE_ERROR_CODES: readonly string[] = ["OUT_OF_RANGE", "INVALID_TIMING"];

export function maxAllowedSimTimeMs(startedAt: Date, now: Date, timeMultiplier: number, toleranceMs: number): number {
  const elapsedMs: number = Math.max(0, now.getTime() - startedAt.getTime());

  return elapsedMs * timeMultiplier + toleranceMs;
}

export function assertSimTimes(simTimesMs: readonly number[], lastSimTimeMs: number, maxAllowedMs: number): void {
  let previous: number = lastSimTimeMs;

  for (const simTimeMs of simTimesMs) {
    if (simTimeMs < previous) {
      throw new SimulationEventTimeNotMonotonicError();
    }

    if (simTimeMs > maxAllowedMs) {
      throw new SimulationEventTimeAheadError();
    }

    previous = simTimeMs;
  }
}

export function settingsAfterEvents(
  initialSettings: Partial<VentilatorSettings>,
  events: readonly SimulationEventRecord[],
): VentilatorSettings {
  return events.reduce(
    (settings: VentilatorSettings, event: SimulationEventRecord): VentilatorSettings =>
      event.type === PARAM_CHANGE_EVENT_TYPE ? { ...settings, ...readSettingsChanges(event.payload) } : settings,
    resolveVentilatorSettings(initialSettings),
  );
}

export function settingsChangesOf(
  initialSettings: Partial<VentilatorSettings>,
  events: readonly SimulationEventRecord[],
): SettingsChange[] {
  const history: SettingsChange[] = [];
  let settings: VentilatorSettings = resolveVentilatorSettings(initialSettings);

  for (const event of events) {
    if (event.type !== PARAM_CHANGE_EVENT_TYPE) {
      continue;
    }

    const changes: Partial<VentilatorSettings> = readSettingsChanges(event.payload);
    const previous: Partial<VentilatorSettings> = pickSettings(settings, Object.keys(changes) as (keyof VentilatorSettings)[]);

    history.push({ simTimeMs: event.simTimeMs, changes, previous });
    settings = { ...settings, ...changes };
  }

  return history;
}

export function sanitizeClientEvents(
  events: readonly ClientSimulationEvent[],
  currentSettings: VentilatorSettings,
): SanitizedSimulationEvent[] {
  let settings: VentilatorSettings = currentSettings;

  return events.map((event: ClientSimulationEvent): SanitizedSimulationEvent => {
    if (event.type === PARAM_CHANGE_EVENT_TYPE) {
      const changes: Partial<VentilatorSettings> = parseSettingsChanges(event.payload);

      settings = applyValidatedChanges(settings, changes);

      return { id: event.id, simTimeMs: event.simTimeMs, type: event.type, payload: { changes } };
    }

    if (event.type === ALARM_ACK_EVENT_TYPE) {
      return { id: event.id, simTimeMs: event.simTimeMs, type: event.type, payload: { alarmCode: parseAlarmCode(event.payload) } };
    }

    throw new InvalidSimulationEventPayloadError("type");
  });
}

export function toEngineEvents(events: readonly SimulationEventRecord[]): EngineEvent[] {
  return events
    .filter((event: SimulationEventRecord): boolean => event.type === PARAM_CHANGE_EVENT_TYPE)
    .map((event: SimulationEventRecord): EngineEvent => ({
      type: "PARAM_CHANGE",
      simTimeMs: event.simTimeMs,
      changes: readSettingsChanges(event.payload),
    }));
}

export function readSettingsChanges(payload: Record<string, unknown>): Partial<VentilatorSettings> {
  const changes: unknown = payload.changes;

  return isRecord(changes) ? (changes) : {};
}

function applyValidatedChanges(settings: VentilatorSettings, changes: Partial<VentilatorSettings>): VentilatorSettings {
  const merged: VentilatorSettings = { ...settings, ...changes };

  try {
    validateVentilatorSettings(merged);
  } catch (error: unknown) {
    if (error instanceof EngineValidationError && RANGE_ERROR_CODES.includes(error.code)) {
      throw new SimulationParameterOutOfRangeError(error.field, error.message);
    }

    if (error instanceof EngineValidationError) {
      throw new InvalidSimulationEventPayloadError(`changes.${error.field}`);
    }

    throw error;
  }

  return merged;
}

function parseSettingsChanges(payload: unknown): Partial<VentilatorSettings> {
  if (!isRecord(payload) || !isRecord(payload.changes)) {
    throw new InvalidSimulationEventPayloadError("changes");
  }

  const raw: Record<string, unknown> = payload.changes;
  const changes: Record<string, number | string> = {};

  for (const key of NUMERIC_SETTING_KEYS) {
    const value: unknown = raw[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new InvalidSimulationEventPayloadError(`changes.${key}`);
    }

    changes[key] = value;
  }

  for (const key of STRING_SETTING_KEYS) {
    const value: unknown = raw[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "string") {
      throw new InvalidSimulationEventPayloadError(`changes.${key}`);
    }

    changes[key] = value;
  }

  if (Object.keys(changes).length === 0) {
    throw new InvalidSimulationEventPayloadError("changes");
  }

  return changes;
}

function parseAlarmCode(payload: unknown): AlarmCode {
  const alarmCode: unknown = isRecord(payload) ? payload.alarmCode : undefined;
  const match: AlarmCode | undefined = ALARM_CODE_VALUES.find((code: AlarmCode): boolean => code === alarmCode);

  if (match === undefined) {
    throw new InvalidSimulationEventPayloadError("alarmCode");
  }

  return match;
}

function pickSettings(settings: VentilatorSettings, keys: readonly (keyof VentilatorSettings)[]): Partial<VentilatorSettings> {
  const picked: Record<string, number | string> = {};

  for (const key of keys) {
    picked[key] = settings[key];
  }

  return picked;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
