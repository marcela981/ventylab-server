/*
 * Funcionalidad: Trama hexadecimal del ventilador
 * Descripción: Define el código del mensaje de comando y la estructura de la trama [START][TYPE][LENGTH][DATA][CHECKSUM] que usa el codificador hexadecimal de comandos (las tramas de telemetría se decodifican en VentilatorTelemetryModule)
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type HexCommandMessage = 0xB1;

export const HEX_COMMAND_MESSAGE: HexCommandMessage = 0xB1;

export interface HexFramePositions {
  readonly START: number;
  readonly TYPE: number;
  readonly LENGTH: number;
  readonly DATA_START: number;
}

export interface HexFrameLayout {
  readonly START_BYTE: number;
  readonly MIN_LENGTH: number;
  readonly MAX_LENGTH: number;
  readonly POSITION: HexFramePositions;
}

export const HEX_FRAME: HexFrameLayout = {
  START_BYTE: 0xFF,
  MIN_LENGTH: 6,
  MAX_LENGTH: 256,
  POSITION: {
    START: 0,
    TYPE: 1,
    LENGTH: 2,
    DATA_START: 3,
  },
};
