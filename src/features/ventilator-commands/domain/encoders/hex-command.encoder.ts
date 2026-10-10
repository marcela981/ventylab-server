/*
 * Funcionalidad: Codificador hexadecimal de comandos
 * Descripción: Trama binaria [0xFF][0xB1][LEN][MODE][TV_HI][TV_LO][RR][PEEP][FIO2*100][PLIM?][IT*10 u16?][XOR] tomada del código preexistente; no existe especificación del protocolo ni validación contra el firmware, la trama no tiene espacio para el identificador de correlación y los parámetros ausentes del modo se escriben como 0. Seleccionable con VENTILATOR_COMMAND_ENCODING=hex
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CommandEncoder, type CommandEncodingValue, type EncodedCommand, HEX_COMMAND_ENCODING } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { type VentilatorCommandModeValue, type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

export const HEX_COMMAND_START_BYTE: number = 0xff;
export const HEX_COMMAND_MESSAGE_TYPE: number = 0xb1;
export const HEX_COMMAND_HEADER_LENGTH: number = 3;

const MODE_BYTE: Readonly<Record<VentilatorCommandModeValue, number>> = {
  VCV: 0x01,
  PCV: 0x02,
  SIMV: 0x03,
  PSV: 0x04,
};

export function xorChecksum(data: Buffer): number {
  let checksum: number = 0;

  for (const byte of data) {
    checksum ^= byte;
  }

  return checksum;
}

function writeUInt16BE(value: number): [number, number] {
  const clamped: number = Math.max(0, Math.min(0xffff, Math.trunc(value)));

  return [(clamped >> 8) & 0xff, clamped & 0xff];
}

function toByte(value: number): number {
  return Math.max(0, Math.min(0xff, Math.trunc(value)));
}

export function encodeHexCommandFrame(command: VentilatorCommandParams): Buffer {
  const data: number[] = [
    MODE_BYTE[command.mode] ?? 0x00,
    ...writeUInt16BE(command.tidalVolume ?? 0),
    toByte(command.respiratoryRate ?? 0),
    toByte(command.peep ?? 0),
    toByte(Math.round((command.fio2 ?? 0) * 100)),
  ];

  if (command.pressureLimit !== undefined) {
    data.push(toByte(command.pressureLimit));
  }

  if (command.inspiratoryTime !== undefined) {
    data.push(...writeUInt16BE(Math.round(command.inspiratoryTime * 10)));
  }

  const header: Buffer = Buffer.from([HEX_COMMAND_START_BYTE, HEX_COMMAND_MESSAGE_TYPE, data.length]);
  const frameWithoutChecksum: Buffer = Buffer.concat([header, Buffer.from(data)]);

  return Buffer.concat([frameWithoutChecksum, Buffer.from([xorChecksum(frameWithoutChecksum)])]);
}

export class HexCommandEncoder implements CommandEncoder {
  public readonly encoding: CommandEncodingValue = HEX_COMMAND_ENCODING;

  public encode(command: VentilatorCommandParams, _correlationId: string): EncodedCommand {
    const frame: Buffer = encodeHexCommandFrame(command);

    return { payload: frame, printable: frame.toString("hex").toUpperCase() };
  }
}
