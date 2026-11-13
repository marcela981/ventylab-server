/*
 * Funcionalidad: Pruebas del destino InfluxDB de la telemetría
 * Descripción: Verifica que dos tramas recibidas en el mismo milisegundo se escriben con instantes distintos (microsegundos de serverTs más un ordinal creciente) y que el reloj no epoch del dispositivo no se usa como instante del punto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Point } from "@influxdata/influxdb-client";

import { type TelemetryFrame } from "@/features/ventilator-telemetry/domain/value-objects/telemetry-frame";
import { InfluxTelemetrySink, SubMillisecondTimestamps } from "@/features/ventilator-telemetry/infrastructure/influx/influx-telemetry.sink";

const mockWrittenPoints: Point[] = [];
const mockWriteApiPrecisions: string[] = [];

jest.mock("@influxdata/influxdb-client", () => {
  const actual: Record<string, unknown> = jest.requireActual<Record<string, unknown>>("@influxdata/influxdb-client");

  return {
    ...actual,
    InfluxDB: jest.fn().mockImplementation(() => ({
      getWriteApi: (_org: string, _bucket: string, precision: string): unknown => {
        mockWriteApiPrecisions.push(precision);

        return {
          useDefaultTags: jest.fn(),
          writePoint: (point: Point): void => {
            mockWrittenPoints.push(point);
          },
          close: jest.fn().mockResolvedValue(undefined),
        };
      },
    })),
  };
});

const SERVER_TS: number = 1_760_000_000_123;

function frame(overrides: Partial<TelemetryFrame> = {}): TelemetryFrame {
  return { pressure: 26, flow: 14.3, volume: 401, deviceId: "ventilab-device-001", serverTs: SERVER_TS, ...overrides };
}

function timestampOf(point: Point): string {
  const line: string = point.toLineProtocol() ?? "";

  return line.slice(line.lastIndexOf(" ") + 1);
}

describe("InfluxTelemetrySink", () => {
  beforeEach(() => {
    mockWrittenPoints.length = 0;
    mockWriteApiPrecisions.length = 0;
  });

  it("writes two frames of the same millisecond with distinct microsecond timestamps", () => {
    const sink: InfluxTelemetrySink = new InfluxTelemetrySink({ url: "http://influx.test:8086", token: "test", org: "org", bucket: "bucket" });

    sink.write(frame({ deviceClock: 147 }));
    sink.write(frame({ deviceClock: 163 }));

    expect(mockWriteApiPrecisions).toEqual(["us"]);
    expect(mockWrittenPoints.map(timestampOf)).toEqual(["1760000000123000", "1760000000123001"]);
  });
});

describe("SubMillisecondTimestamps", () => {
  it("restarts the ordinal on a new millisecond and never repeats inside one", () => {
    const timestamps: SubMillisecondTimestamps = new SubMillisecondTimestamps();

    const values: number[] = [SERVER_TS, SERVER_TS, SERVER_TS, SERVER_TS + 1, SERVER_TS + 1].map((serverTs: number): number => timestamps.next(serverTs));

    expect(values).toEqual([1_760_000_000_123_000, 1_760_000_000_123_001, 1_760_000_000_123_002, 1_760_000_000_124_000, 1_760_000_000_124_001]);
  });
});
