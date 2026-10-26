/*
 * Funcionalidad: Trama de telemetría del ventilador
 * Descripción: Forma normalizada TelemetryFrame de una muestra del ventilador físico (presión, flujo, volumen, secuencia, marcas de tiempo del dispositivo y del servidor, modo, parámetros y alarmas) y su proyección a la muestra de forma de onda del motor de simulación. v1.1: sin la lectura heredada VentilatorReading (ventilator:data ya no se emite)
 * Versión: 1.1
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

export interface TelemetryWaveformSample {
  simTimeMs: number;
  pressureCmH2O: number;
  flowLpm: number;
  volumeMl: number;
}

export function stampTelemetryFrame(decoded: DecodedTelemetry, serverTs: number): TelemetryFrame {
  return { ...decoded, serverTs };
}

export function toWaveformSample(frame: TelemetryFrame, t0: number): TelemetryWaveformSample {
  return {
    simTimeMs: frame.serverTs - t0,
    pressureCmH2O: frame.pressure,
    flowLpm: frame.flow,
    volumeMl: frame.volume,
  };
}
