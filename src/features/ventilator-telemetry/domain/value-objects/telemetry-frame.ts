/*
 * Funcionalidad: Trama de telemetría del ventilador
 * Descripción: Forma normalizada TelemetryFrame de una muestra del ventilador físico (presión, flujo, volumen, secuencia, marcas de tiempo del dispositivo y del servidor, modo, parámetros y alarmas) y su proyección a la muestra de forma de onda del motor de simulación. v1.1: sin la lectura heredada VentilatorReading (ventilator:data ya no se emite). v1.2: deviceTs solo contiene tiempo epoch válido del dispositivo y deviceClock conserva el reloj no epoch original (p. ej. tiempo de encendido) sin usarse para latencia ni orden
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface TelemetryFrame {
  readonly seq?: number;
  // Device time in epoch ms; only set when the device sent a valid epoch value
  readonly deviceTs?: number;
  // Raw non-epoch device clock (e.g. firmware uptime) kept as received; never used for latency, ordering or freshness
  readonly deviceClock?: number;
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
