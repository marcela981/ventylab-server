/*
 * Funcionalidad: Detector de huecos de secuencia
 * Descripción: Cuenta los mensajes perdidos a partir del número de secuencia de las tramas del ventilador: un salto hacia adelante suma salto - 1; un número repetido es un duplicado; un retroceso dentro de la ventana de reordenamiento (16 por defecto) es una trama tardía que se cuenta como reordenada sin sumar pérdidas ni mover la referencia; un retroceso mayor reinicia la referencia (reinicio del dispositivo). Con secuencias de 16 o 32 bits admite la vuelta a 0 solo cuando la referencia está en el último dieciseisavo del rango, la nueva trama en el primero y la pérdida implícita no supera 64 ventanas de reordenamiento; si la supera es un reinicio
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type SequenceWrapBits = 0 | 16 | 32;

export const DEFAULT_SEQUENCE_REORDER_WINDOW: number = 16;
export const SEQUENCE_WRAP_BITS_VALUES: readonly SequenceWrapBits[] = [0, 16, 32];

export interface SequenceGapTrackerOptions {
  readonly reorderWindow?: number;
  readonly wrapBits?: SequenceWrapBits;
}

export interface SequenceObservation {
  readonly lost: number;
  readonly reordered: boolean;
  readonly duplicate: boolean;
  readonly restarted: boolean;
}

const NOTHING_OBSERVED: SequenceObservation = { lost: 0, reordered: false, duplicate: false, restarted: false };
const REORDERED: SequenceObservation = { lost: 0, reordered: true, duplicate: false, restarted: false };
const DUPLICATE: SequenceObservation = { lost: 0, reordered: false, duplicate: true, restarted: false };
const RESTARTED: SequenceObservation = { lost: 0, reordered: false, duplicate: false, restarted: true };
const WRAP_EDGE_FRACTION: number = 16;
const MAX_WRAP_LOSS_IN_REORDER_WINDOWS: number = 64;

export class SequenceGapTracker {
  private readonly _reorderWindow: number;
  private readonly _maxWrapLoss: number;
  private readonly _modulus: number | undefined;
  private _lastSeq: number | undefined;

  public constructor({ reorderWindow = DEFAULT_SEQUENCE_REORDER_WINDOW, wrapBits = 0 }: SequenceGapTrackerOptions = {}) {
    this._reorderWindow = reorderWindow;
    this._maxWrapLoss = reorderWindow * MAX_WRAP_LOSS_IN_REORDER_WINDOWS;
    this._modulus = wrapBits === 0 ? undefined : 2 ** wrapBits;
  }

  public observe(seq: number | undefined): SequenceObservation {
    if (seq === undefined) {
      return NOTHING_OBSERVED;
    }

    const last: number | undefined = this._lastSeq;

    if (last === undefined) {
      this._lastSeq = seq;

      return NOTHING_OBSERVED;
    }

    const delta: number = this._delta(last, seq);

    if (delta > 0) {
      this._lastSeq = seq;

      return { lost: delta - 1, reordered: false, duplicate: false, restarted: false };
    }

    if (delta === 0) {
      return DUPLICATE;
    }

    if (-delta <= this._reorderWindow) {
      return REORDERED;
    }

    this._lastSeq = seq;

    return RESTARTED;
  }

  public reset(): void {
    this._lastSeq = undefined;
  }

  private _delta(last: number, seq: number): number {
    const raw: number = seq - last;
    const modulus: number | undefined = this._modulus;

    if (modulus === undefined) {
      return raw;
    }

    const edge: number = modulus / WRAP_EDGE_FRACTION;
    const nearMax = (value: number): boolean => value >= modulus - edge;
    const nearZero = (value: number): boolean => value < edge;

    // A reboot that lands near zero must not count thousands of phantom losses
    if (raw < 0 && nearMax(last) && nearZero(seq) && raw + modulus - 1 <= this._maxWrapLoss) {
      return raw + modulus;
    }

    if (raw > 0 && nearZero(last) && nearMax(seq)) {
      return raw - modulus;
    }

    return raw;
  }
}
