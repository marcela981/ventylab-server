/*
 * Funcionalidad: Búfer circular de latencias
 * Descripción: Guarda en memoria fija (Float64Array) las últimas N muestras de latencia con su instante de registro, calcula percentiles por rango más cercano y cuenta eventos por segundo con una ventana deslizante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface LatencySample {
  readonly valueMs: number;
  readonly recordedAt: number;
}

export interface LatencySummary {
  readonly count: number;
  readonly p50: number | null;
  readonly p95: number | null;
  readonly p99: number | null;
  readonly max: number | null;
}

const RATE_WINDOW_MS: number = 1000;

export function percentile(sorted: readonly number[], p: number): number | null {
  if (sorted.length === 0) {
    return null;
  }

  const rank: number = Math.ceil((p / 100) * sorted.length);

  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

export class LatencyRingBuffer {
  private readonly _values: Float64Array;
  private readonly _recordedAt: Float64Array;
  private _next: number = 0;
  private _size: number = 0;

  public constructor(public readonly capacity: number) {
    this._values = new Float64Array(capacity);
    this._recordedAt = new Float64Array(capacity);
  }

  public get size(): number {
    return this._size;
  }

  public push(valueMs: number, recordedAt: number): void {
    this._values[this._next] = valueMs;
    this._recordedAt[this._next] = recordedAt;
    this._next = (this._next + 1) % this.capacity;
    this._size = Math.min(this._size + 1, this.capacity);
  }

  public summary(): LatencySummary {
    const sorted: number[] = Array.from(this._values.subarray(0, this._size)).sort((a: number, b: number): number => a - b);

    return {
      count: sorted.length,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      max: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    };
  }

  public samples(): LatencySample[] {
    const start: number = this._size < this.capacity ? 0 : this._next;
    const result: LatencySample[] = [];

    for (let offset: number = 0; offset < this._size; offset++) {
      const index: number = (start + offset) % this.capacity;

      result.push({ valueMs: this._values[index], recordedAt: this._recordedAt[index] });
    }

    return result;
  }

  public clear(): void {
    this._next = 0;
    this._size = 0;
  }
}

export class RateCounter {
  private readonly _timestamps: Float64Array;
  private _next: number = 0;
  private _size: number = 0;

  public constructor(private readonly _capacity: number) {
    this._timestamps = new Float64Array(_capacity);
  }

  public record(now: number): void {
    this._timestamps[this._next] = now;
    this._next = (this._next + 1) % this._capacity;
    this._size = Math.min(this._size + 1, this._capacity);
  }

  public perSecond(now: number): number {
    const cutoff: number = now - RATE_WINDOW_MS;
    let count: number = 0;

    for (let offset: number = 1; offset <= this._size; offset++) {
      const index: number = (this._next - offset + this._capacity) % this._capacity;

      if (this._timestamps[index] <= cutoff) {
        break;
      }

      count++;
    }

    return count;
  }

  public clear(): void {
    this._next = 0;
    this._size = 0;
  }
}
