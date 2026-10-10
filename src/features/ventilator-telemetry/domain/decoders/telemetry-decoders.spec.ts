/*
 * Funcionalidad: Pruebas de los decodificadores de telemetría
 * Descripción: Verifica los decodificadores JSON (validación estricta y campos opcionales), hexadecimal (fusión de tramas parciales y alarmas), automático (JSON y luego hexadecimal), la alarma JSON del tópico de alarmas y la selección por configuración
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { AutoTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/auto-telemetry.decoder";
import { createTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/create-telemetry-decoder";
import { HexTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/hex-telemetry.decoder";
import { decodeJsonAlarm } from "@/features/ventilator-telemetry/domain/decoders/json-alarm.decoder";
import { JsonTelemetryDecoder } from "@/features/ventilator-telemetry/domain/decoders/json-telemetry.decoder";
import { type DecodeResult } from "@/features/ventilator-telemetry/domain/decoders/telemetry-decoder";

const DEVICE_ID: string = "device-test";

function json(value: unknown): Buffer {
  return Buffer.from(JSON.stringify(value), "utf-8");
}

function hexFrame(type: number, data: number[]): Buffer {
  const bytes: number[] = [0xFF, type, data.length, ...data];
  const checksum: number = bytes.reduce((acc: number, byte: number): number => acc ^ byte, 0);

  return Buffer.from([...bytes, checksum]);
}

describe("JsonTelemetryDecoder", () => {
  it("decodes a minimal frame and fills the default device id", () => {
    const decoder: JsonTelemetryDecoder = new JsonTelemetryDecoder(DEVICE_ID);

    const result: DecodeResult = decoder.decode(json({ pressure: 12.5, flow: -30, volume: 410 }));

    expect(result).toEqual({ ok: true, kind: "frame", frame: { pressure: 12.5, flow: -30, volume: 410, deviceId: DEVICE_ID } });
  });

  it("keeps every optional field when it is valid", () => {
    const decoder: JsonTelemetryDecoder = new JsonTelemetryDecoder(DEVICE_ID);
    const payload: Record<string, unknown> = {
      pressure: 20,
      flow: 40,
      volume: 500,
      seq: 7,
      deviceTs: 1_760_000_000_000,
      mode: "VCV",
      settings: { peep: 5, fio2: 0.4 },
      alarms: ["HIGH_PRESSURE"],
      pco2: 38,
      spo2: 97,
      deviceId: "ventilab-device-001",
    };

    const result: DecodeResult = decoder.decode(json(payload));

    expect(result).toEqual({ ok: true, kind: "frame", frame: payload });
  });

  it("uses a legacy epoch timestamp as device timestamp and ignores a non-epoch one", () => {
    const decoder: JsonTelemetryDecoder = new JsonTelemetryDecoder(DEVICE_ID);

    const epoch: DecodeResult = decoder.decode(json({ pressure: 1, flow: 1, volume: 1, timestamp: 1_760_000_000_000 }));
    const uptime: DecodeResult = decoder.decode(json({ pressure: 1, flow: 1, volume: 1, timestamp: 12_345 }));

    expect(epoch.ok && epoch.kind === "frame" ? epoch.frame.deviceTs : undefined).toBe(1_760_000_000_000);
    expect(uptime.ok && uptime.kind === "frame" ? uptime.frame.deviceTs : "set").toBeUndefined();
  });

  it.each([
    ["not json", Buffer.from("{oops", "utf-8"), "invalid_json"],
    ["not an object", json(42), "not_an_object"],
    ["missing volume", json({ pressure: 1, flow: 1 }), "missing_fields"],
    ["string pressure", json({ pressure: "1", flow: 1, volume: 1 }), "missing_fields"],
    ["non finite value", Buffer.from("{\"pressure\":1e999,\"flow\":1,\"volume\":1}", "utf-8"), "missing_fields"],
    ["negative seq", json({ pressure: 1, flow: 1, volume: 1, seq: -1 }), "invalid_seq"],
    ["fractional seq", json({ pressure: 1, flow: 1, volume: 1, seq: 1.5 }), "invalid_seq"],
    ["string spo2", json({ pressure: 1, flow: 1, volume: 1, spo2: "97" }), "invalid_spo2"],
    ["non numeric setting", json({ pressure: 1, flow: 1, volume: 1, settings: { peep: "5" } }), "invalid_settings"],
    ["non string alarm", json({ pressure: 1, flow: 1, volume: 1, alarms: [1] }), "invalid_alarms"],
    ["empty device id", json({ pressure: 1, flow: 1, volume: 1, deviceId: "" }), "invalid_device_id"],
  ])("rejects %s", (_label: string, buffer: Buffer, reason: string) => {
    const decoder: JsonTelemetryDecoder = new JsonTelemetryDecoder(DEVICE_ID);

    const result: DecodeResult = decoder.decode(buffer);

    expect(result).toEqual({ ok: false, reason });
  });
});

describe("HexTelemetryDecoder", () => {
  it("merges partial pressure, flow and volume frames into one rolling reading", () => {
    const decoder: HexTelemetryDecoder = new HexTelemetryDecoder(DEVICE_ID);

    decoder.decode(hexFrame(0xA1, [0x00, 0xC8]));
    decoder.decode(hexFrame(0xA2, [0xFF, 0x38]));
    const result: DecodeResult = decoder.decode(hexFrame(0xA3, [0x01, 0xF4]));

    expect(result).toEqual({ ok: true, kind: "frame", frame: { pressure: 20, flow: -20, volume: 500, deviceId: DEVICE_ID } });
  });

  it("decodes an alarm frame into a ventilator alarm", () => {
    const decoder: HexTelemetryDecoder = new HexTelemetryDecoder(DEVICE_ID);

    const result: DecodeResult = decoder.decode(hexFrame(0xA4, [0x01, 0x04]));

    expect(result.ok && result.kind === "alarm" ? result.alarm : undefined).toEqual(expect.objectContaining({
      type: "HIGH_PRESSURE",
      severity: "CRITICAL",
      message: "[CRITICAL] High airway pressure detected",
      active: true,
      acknowledged: false,
    }));
  });

  it("rejects a frame with a bad checksum", () => {
    const decoder: HexTelemetryDecoder = new HexTelemetryDecoder(DEVICE_ID);
    const frame: Buffer = hexFrame(0xA1, [0x00, 0xC8]);

    frame[frame.length - 1] ^= 0x01;

    const result: DecodeResult = decoder.decode(frame);

    expect(result).toEqual({ ok: false, reason: "hex_checksum_mismatch" });
  });

  it("rejects a buffer that is not a hex frame", () => {
    const decoder: HexTelemetryDecoder = new HexTelemetryDecoder(DEVICE_ID);

    const result: DecodeResult = decoder.decode(Buffer.from("hello", "utf-8"));

    expect(result.ok).toBe(false);
  });
});

describe("AutoTelemetryDecoder", () => {
  it("decodes json first and falls back to hex when the payload is not json", () => {
    const decoder: AutoTelemetryDecoder = new AutoTelemetryDecoder(DEVICE_ID);

    const fromJson: DecodeResult = decoder.decode(json({ pressure: 1, flow: 2, volume: 3 }));
    const fromHex: DecodeResult = decoder.decode(hexFrame(0xA1, [0x00, 0x64]));

    expect(fromJson.ok).toBe(true);
    expect(fromHex.ok && fromHex.kind === "frame" ? fromHex.frame.pressure : undefined).toBe(10);
  });

  it("does not fall back to hex for json with missing fields", () => {
    const decoder: AutoTelemetryDecoder = new AutoTelemetryDecoder(DEVICE_ID);

    const result: DecodeResult = decoder.decode(json({ pressure: 1 }));

    expect(result).toEqual({ ok: false, reason: "missing_fields" });
  });

  it("reports an invalid payload that is neither json nor hex", () => {
    const decoder: AutoTelemetryDecoder = new AutoTelemetryDecoder(DEVICE_ID);

    const result: DecodeResult = decoder.decode(Buffer.from([0x01, 0x02, 0x03]));

    expect(result.ok).toBe(false);
  });
});

describe("decodeJsonAlarm", () => {
  it("parses a json alarm with defaults", () => {
    const result: DecodeResult | undefined = decodeJsonAlarm(json({ type: "APNEA" }), 1_000);

    expect(result).toEqual({
      ok: true,
      kind: "alarm",
      alarm: { type: "APNEA", severity: "MEDIUM", message: "[MEDIUM] Apnea detected – no breaths detected", timestamp: 1_000, active: true, acknowledged: false },
    });
  });

  it("keeps explicit alarm fields", () => {
    const payload: Record<string, unknown> = {
      type: "HIGH_PRESSURE",
      severity: "HIGH",
      message: "Paw 45",
      currentValue: 45,
      thresholdValue: 40,
      timestamp: 2_000,
      active: false,
      acknowledged: true,
    };

    const result: DecodeResult | undefined = decodeJsonAlarm(json(payload), 1_000);

    expect(result).toEqual({ ok: true, kind: "alarm", alarm: payload });
  });

  it("rejects an unknown alarm type", () => {
    const result: DecodeResult | undefined = decodeJsonAlarm(json({ type: "SMOKE" }), 1_000);

    expect(result).toEqual({ ok: false, reason: "unknown_alarm_type" });
  });

  it("returns undefined for payloads that are not json alarm objects", () => {
    const notJson: DecodeResult | undefined = decodeJsonAlarm(hexFrame(0xA4, [0x01, 0x01]), 1_000);
    const telemetry: DecodeResult | undefined = decodeJsonAlarm(json({ pressure: 1, flow: 1, volume: 1 }), 1_000);

    expect(notJson).toBeUndefined();
    expect(telemetry).toBeUndefined();
  });
});

describe("createTelemetryDecoder", () => {
  it.each([
    ["auto", AutoTelemetryDecoder],
    ["json", JsonTelemetryDecoder],
    ["hex", HexTelemetryDecoder],
  ] as const)("selects the %s decoder", (name: "auto" | "json" | "hex", type: abstract new (...args: never[]) => unknown) => {
    const decoder: unknown = createTelemetryDecoder(name, DEVICE_ID);

    expect(decoder).toBeInstanceOf(type);
  });
});
