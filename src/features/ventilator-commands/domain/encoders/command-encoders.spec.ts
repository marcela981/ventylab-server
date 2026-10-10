/*
 * Funcionalidad: Pruebas de los codificadores de comandos
 * Descripción: Verifica el JSON plano heredado con correlationId e ieRatio como "I:E", la selección por configuración y la autoconsistencia determinista de la trama hexadecimal (cabecera, longitud, bytes de modo y parámetros, XOR); no existen vectores de una especificación ni del firmware, así que no hay prueba de ida y vuelta contra una referencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EncodedCommand } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { createCommandEncoder } from "@/features/ventilator-commands/domain/encoders/create-command-encoder";
import {
  encodeHexCommandFrame,
  HEX_COMMAND_HEADER_LENGTH,
  HEX_COMMAND_MESSAGE_TYPE,
  HEX_COMMAND_START_BYTE,
  HexCommandEncoder,
  xorChecksum,
} from "@/features/ventilator-commands/domain/encoders/hex-command.encoder";
import { formatIeRatio, JsonCommandEncoder } from "@/features/ventilator-commands/domain/encoders/json-command.encoder";
import { type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

const PCV: VentilatorCommandParams = { mode: "PCV", respiratoryRate: 15, peep: 5, fio2: 0.4, pressureLimit: 25, inspiratoryTime: 1, ieRatio: 1 / 3 };

describe("JsonCommandEncoder", () => {
  it("keeps the flat legacy payload and adds the correlationId", () => {
    const encoded: EncodedCommand = new JsonCommandEncoder().encode(PCV, "cmd-1");

    expect(JSON.parse(String(encoded.payload))).toEqual({ mode: "PCV", respiratoryRate: 15, peep: 5, fio2: 0.4, pressureLimit: 25, inspiratoryTime: 1, ieRatio: "1:3", correlationId: "cmd-1" });
    expect(encoded.printable).toBe(encoded.payload);
  });

  it("formats I:E ratios as legacy strings", () => {
    expect([formatIeRatio(0.5), formatIeRatio(1), formatIeRatio(2), formatIeRatio(1 / 2.5)]).toEqual(["1:2", "1:1", "2:1", "1:2.5"]);
  });
});

describe("HexCommandEncoder", () => {
  it("builds a self-consistent frame: header, length, mode, parameters and XOR checksum", () => {
    const frame: Buffer = encodeHexCommandFrame({ mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4, pressureLimit: 30, inspiratoryTime: 1.2 });

    expect(frame[0]).toBe(HEX_COMMAND_START_BYTE);
    expect(frame[1]).toBe(HEX_COMMAND_MESSAGE_TYPE);
    expect(frame[2]).toBe(frame.length - HEX_COMMAND_HEADER_LENGTH - 1);
    expect([...frame.subarray(HEX_COMMAND_HEADER_LENGTH, frame.length - 1)]).toEqual([0x01, 0x01, 0xc2, 14, 5, 40, 30, 0x00, 12]);
    expect(xorChecksum(frame)).toBe(0);
  });

  it("omits the optional bytes and writes absent parameters as 0", () => {
    const frame: Buffer = encodeHexCommandFrame({ mode: "PSV", peep: 5, fio2: 0.21, pressureLimit: 20 });

    expect(frame[2]).toBe(7);
    expect([...frame.subarray(HEX_COMMAND_HEADER_LENGTH, frame.length - 1)]).toEqual([0x04, 0, 0, 0, 5, 21, 20]);
    expect(xorChecksum(frame)).toBe(0);
  });

  it("is deterministic and prints the frame in hexadecimal", () => {
    const first: EncodedCommand = new HexCommandEncoder().encode(PCV, "cmd-1");
    const second: EncodedCommand = new HexCommandEncoder().encode(PCV, "cmd-2");

    expect(first.payload).toEqual(second.payload);
    expect(first.printable).toBe((first.payload as Buffer).toString("hex").toUpperCase());
  });
});

describe("createCommandEncoder", () => {
  it("selects the configured encoding", () => {
    expect([createCommandEncoder("json").encoding, createCommandEncoder("hex").encoding]).toEqual(["json", "hex"]);
  });
});
