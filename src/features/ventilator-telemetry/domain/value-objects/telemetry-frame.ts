/*
 * Funcionalidad: Trama de telemetría del ventilador
 * Descripción: Forma normalizada TelemetryFrame de una muestra del ventilador físico (presión, flujo, volumen, secuencia, marcas de tiempo del dispositivo y del servidor, modo, parámetros y alarmas) y sus proyecciones a la lectura heredada VentilatorReading y a la muestra de forma de onda del motor de simulación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface TelemetryFrame {
  readonly seq?: number;
  readonly deviceTs?: number;
  readonly serverTs: number;
  readonly pressure: number;
  readonly flow: number;
  readonly volume: number;
  readonly mode?: string;
  readonly settings?: Readonly<Record<string, number>>;
  readonly alarms?: readonly string[];
  readonly pco2?: number;
  readonly spo2?: number;
  readonly deviceId: string;
}

export type DecodedTelemetry = Omit<TelemetryFrame, "serverTs">;

export interface VentilatorReading {
  pressure: number;
  flow: number;
  volume: number;
  pco2?: number;
  spo2?: number;
  timestamp: number;
  deviceId: string;
}

export interface TelemetryWaveformSample {
  simTimeMs: number;
  pressureCmH2O: number;
  flowLpm: number;
  volumeMl: number;
}

export function stampTelemetryFrame(decoded: DecodedTelemetry, serverTs: number): TelemetryFrame {
  return { ...decoded, serverTs };
}

export function toVentilatorReading(frame: TelemetryFrame): VentilatorReading {
  const reading: VentilatorReading = {
    pressure: frame.pressure,
    flow: frame.flow,
    volume: frame.volume,
    timestamp: frame.deviceTs ?? frame.serverTs,
    deviceId: frame.deviceId,
  };

  if (frame.pco2 !== undefined) {
    reading.pco2 = frame.pco2;
  }

  if (frame.spo2 !== undefined) {
    reading.spo2 = frame.spo2;
  }

  return reading;
}

export function toWaveformSample(frame: TelemetryFrame, t0: number): TelemetryWaveformSample {
  return {
    simTimeMs: frame.serverTs - t0,
    pressureCmH2O: frame.pressure,
    flowLpm: frame.flow,
    volumeMl: frame.volume,
  };
}
