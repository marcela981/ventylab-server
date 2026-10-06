/*
 * Funcionalidad: Encoder de comandos hexadecimales
 * Descripción: Valida un comando del ventilador contra los rangos seguros y lo codifica en la trama binaria [0xFF][0xB1][LENGTH][MODE][TV][RR][PEEP][FIO2][PLIM?][IT?][CHECKSUM]
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { HEX_COMMAND_MESSAGE, HEX_FRAME } from "@/features/simulation/domain/value-objects/hex-frame";
import {
  VENTILATOR_SAFE_RANGES,
  type VentilationModeValue,
  type VentilatorCommand,
  type VentilatorSafeRanges,
} from "@/features/simulation/domain/value-objects/ventilator-command";

const MODE_BYTE: Readonly<Record<VentilationModeValue, number>> = {
  VCV: 0x01,
  PCV: 0x02,
  SIMV: 0x03,
  PSV: 0x04,
};

export function getCommandValidationErrors(command: VentilatorCommand): string[] {
  const errors: string[] = [];
  const r: VentilatorSafeRanges = VENTILATOR_SAFE_RANGES;

  if (command.tidalVolume < r.TIDAL_VOLUME.min || command.tidalVolume > r.TIDAL_VOLUME.max) {
    errors.push(`tidalVolume ${command.tidalVolume} out of range [${r.TIDAL_VOLUME.min}, ${r.TIDAL_VOLUME.max}] ${r.TIDAL_VOLUME.unit}`);
  }

  if (command.respiratoryRate < r.RESPIRATORY_RATE.min || command.respiratoryRate > r.RESPIRATORY_RATE.max) {
    errors.push(`respiratoryRate ${command.respiratoryRate} out of range [${r.RESPIRATORY_RATE.min}, ${r.RESPIRATORY_RATE.max}] ${r.RESPIRATORY_RATE.unit}`);
  }

  if (command.peep < r.PEEP.min || command.peep > r.PEEP.max) {
    errors.push(`peep ${command.peep} out of range [${r.PEEP.min}, ${r.PEEP.max}] ${r.PEEP.unit}`);
  }

  if (command.fio2 < r.FIO2.min || command.fio2 > r.FIO2.max) {
    errors.push(`fio2 ${command.fio2} out of range [${r.FIO2.min}, ${r.FIO2.max}] ${r.FIO2.unit}`);
  }

  if (command.pressureLimit !== undefined) {
    if (command.pressureLimit < r.PRESSURE_LIMIT.min || command.pressureLimit > r.PRESSURE_LIMIT.max) {
      errors.push(`pressureLimit ${command.pressureLimit} out of range [${r.PRESSURE_LIMIT.min}, ${r.PRESSURE_LIMIT.max}] ${r.PRESSURE_LIMIT.unit}`);
    }
  }

  if (command.inspiratoryTime !== undefined) {
    if (command.inspiratoryTime < r.INSPIRATORY_TIME.min || command.inspiratoryTime > r.INSPIRATORY_TIME.max) {
      errors.push(`inspiratoryTime ${command.inspiratoryTime} out of range [${r.INSPIRATORY_TIME.min}, ${r.INSPIRATORY_TIME.max}] ${r.INSPIRATORY_TIME.unit}`);
    }
  }

  return errors;
}

export function isValidCommand(command: VentilatorCommand): boolean {
  return getCommandValidationErrors(command).length === 0;
}

export function encodeHexCommand(command: VentilatorCommand): Buffer {
  if (!isValidCommand(command)) {
    const errors: string[] = getCommandValidationErrors(command);

    throw new RangeError(`[HexEncoder] Invalid command: ${errors.join("; ")}`);
  }

  const data: number[] = [
    MODE_BYTE[command.mode] ?? 0x00,
    ...writeUInt16BE(command.tidalVolume),
    command.respiratoryRate,
    command.peep,
    Math.round(command.fio2 * 100),
  ];

  if (command.pressureLimit !== undefined) {
    data.push(command.pressureLimit);
  }

  if (command.inspiratoryTime !== undefined) {
    data.push(...writeUInt16BE(Math.round(command.inspiratoryTime * 10)));
  }

  const header: Buffer = Buffer.from([HEX_FRAME.START_BYTE, HEX_COMMAND_MESSAGE, data.length]);
  const frameWithoutChecksum: Buffer = Buffer.concat([header, Buffer.from(data)]);
  const checksum: number = xorAll(frameWithoutChecksum);

  return Buffer.concat([frameWithoutChecksum, Buffer.from([checksum])]);
}

function xorAll(data: Buffer): number {
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
