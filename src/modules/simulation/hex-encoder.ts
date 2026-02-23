/**
 * @module HexEncoder
 * @description Encoder de comandos a tramas hexadecimales para el ventilador.
 * Implementa la interfaz IHexEncoder definida en los contratos.
 *
 * Convierte objetos VentilatorCommand en buffers binarios listos
 * para enviar via MQTT al ventilador físico, siguiendo la estructura:
 *
 *   [START=0xFF] [TYPE=0xB1] [LENGTH] [DATA...] [CHECKSUM]
 *
 * Campos de datos (en orden):
 *   [MODE]          1 byte  — código del modo de ventilación
 *   [TV_HI][TV_LO]  2 bytes — tidalVolume en ml, uint16 BE
 *   [RR]            1 byte  — respiratoryRate en resp/min
 *   [PEEP]          1 byte  — PEEP en cmH₂O
 *   [FIO2]          1 byte  — fio2 × 100 (0.40 → 40)
 *   [PLIM]          1 byte  — pressureLimit en cmH₂O   (opcional)
 *   [IT_HI][IT_LO]  2 bytes — inspiratoryTime × 10, uint16 BE (opcional)
 *
 * Checksum: XOR de todos los bytes del frame excepto el último.
 * (Algoritmo idéntico al de HexParser.)
 */

import type {
  IHexEncoder,
  VentilatorCommand,
} from '../../../contracts/simulation.contracts';
import {
  HexMessageType,
  HEX_FRAME,
  VentilationMode,
  VENTILATOR_SAFE_RANGES,
} from '../../../contracts/simulation.contracts';

/** Byte codes for VentilationMode, shared with the ventilator firmware. */
const MODE_BYTE: Record<VentilationMode, number> = {
  [VentilationMode.VCV]: 0x01,
  [VentilationMode.PCV]: 0x02,
  [VentilationMode.SIMV]: 0x03,
  [VentilationMode.PSV]: 0x04,
};

export class HexEncoder implements IHexEncoder {
  // ---------------------------------------------------------------------------
  // IHexEncoder implementation
  // ---------------------------------------------------------------------------

  /**
   * Codifica un VentilatorCommand a buffer hexadecimal listo para MQTT.
   * @throws {RangeError} si el comando tiene parámetros fuera de rango
   */
  encode(command: VentilatorCommand): Buffer {
    if (!this.validateCommand(command)) {
      const errors = this.getValidationErrors(command);
      throw new RangeError(`[HexEncoder] Invalid command: ${errors.join('; ')}`);
    }

    const data: number[] = [
      this.encodeMode(command.mode),
      ...this.writeUInt16BE(command.tidalVolume),
      command.respiratoryRate,
      command.peep,
      Math.round(command.fio2 * 100), // 0.40 → 40, 1.0 → 100
    ];

    if (command.pressureLimit !== undefined) {
      data.push(command.pressureLimit);
    }

    if (command.inspiratoryTime !== undefined) {
      data.push(...this.writeUInt16BE(Math.round(command.inspiratoryTime * 10)));
    }

    const header = Buffer.from([
      HEX_FRAME.START_BYTE,        // 0xFF
      HexMessageType.COMMAND,      // 0xB1
      data.length,
    ]);
    const payload = Buffer.from(data);
    const frameWithoutChecksum = Buffer.concat([header, payload]);
    const checksum = this.calculateChecksum(frameWithoutChecksum);

    return Buffer.concat([frameWithoutChecksum, Buffer.from([checksum])]);
  }

  /**
   * Valida que todos los parámetros requeridos estén dentro de rangos seguros.
   */
  validateCommand(command: VentilatorCommand): boolean {
    return this.getValidationErrors(command).length === 0;
  }

  /**
   * Retorna una lista de mensajes de error, uno por cada parámetro fuera de rango.
   * Array vacío si el comando es válido.
   */
  getValidationErrors(command: VentilatorCommand): string[] {
    const errors: string[] = [];
    const r = VENTILATOR_SAFE_RANGES;

    if (
      command.tidalVolume < r.TIDAL_VOLUME.min ||
      command.tidalVolume > r.TIDAL_VOLUME.max
    ) {
      errors.push(
        `tidalVolume ${command.tidalVolume} out of range [${r.TIDAL_VOLUME.min}, ${r.TIDAL_VOLUME.max}] ${r.TIDAL_VOLUME.unit}`,
      );
    }

    if (
      command.respiratoryRate < r.RESPIRATORY_RATE.min ||
      command.respiratoryRate > r.RESPIRATORY_RATE.max
    ) {
      errors.push(
        `respiratoryRate ${command.respiratoryRate} out of range [${r.RESPIRATORY_RATE.min}, ${r.RESPIRATORY_RATE.max}] ${r.RESPIRATORY_RATE.unit}`,
      );
    }

    if (command.peep < r.PEEP.min || command.peep > r.PEEP.max) {
      errors.push(
        `peep ${command.peep} out of range [${r.PEEP.min}, ${r.PEEP.max}] ${r.PEEP.unit}`,
      );
    }

    if (command.fio2 < r.FIO2.min || command.fio2 > r.FIO2.max) {
      errors.push(
        `fio2 ${command.fio2} out of range [${r.FIO2.min}, ${r.FIO2.max}] ${r.FIO2.unit}`,
      );
    }

    if (command.pressureLimit !== undefined) {
      if (
        command.pressureLimit < r.PRESSURE_LIMIT.min ||
        command.pressureLimit > r.PRESSURE_LIMIT.max
      ) {
        errors.push(
          `pressureLimit ${command.pressureLimit} out of range [${r.PRESSURE_LIMIT.min}, ${r.PRESSURE_LIMIT.max}] ${r.PRESSURE_LIMIT.unit}`,
        );
      }
    }

    if (command.inspiratoryTime !== undefined) {
      if (
        command.inspiratoryTime < r.INSPIRATORY_TIME.min ||
        command.inspiratoryTime > r.INSPIRATORY_TIME.max
      ) {
        errors.push(
          `inspiratoryTime ${command.inspiratoryTime} out of range [${r.INSPIRATORY_TIME.min}, ${r.INSPIRATORY_TIME.max}] ${r.INSPIRATORY_TIME.unit}`,
        );
      }
    }

    return errors;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Calcula el checksum de la trama (sin el byte de checksum).
   * Algoritmo: XOR de todos los bytes del buffer recibido.
   * Equivalente a HexParser.calculateChecksum(fullFrame) donde fullFrame
   * = Buffer.concat([data, checksum]).
   */
  private calculateChecksum(data: Buffer): number {
    let checksum = 0;
    for (const byte of data) {
      checksum ^= byte;
    }
    return checksum;
  }

  /**
   * Mapea un VentilationMode a su byte de wire.
   */
  private encodeMode(mode: VentilationMode): number {
    return MODE_BYTE[mode] ?? 0x00;
  }

  /**
   * Serializa un entero sin signo a 2 bytes big-endian.
   * @returns Tupla [high_byte, low_byte]
   */
  private writeUInt16BE(value: number): [number, number] {
    const clamped = Math.max(0, Math.min(0xffff, Math.trunc(value)));
    return [(clamped >> 8) & 0xff, clamped & 0xff];
  }
}
