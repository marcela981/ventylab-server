/*
 * Funcionalidad: Cubo de fichas
 * Descripción: Limitador de frecuencia puro con capacidad igual a la tasa por segundo y recarga continua; indica cuántos milisegundos esperar cuando no queda una ficha
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const MS_PER_SECOND: number = 1000;

export class TokenBucket {
  private _tokens: number;
  private _updatedAt: number;

  public constructor(
    private readonly _ratePerSecond: number,
    nowMs: number,
  ) {
    this._tokens = _ratePerSecond;
    this._updatedAt = nowMs;
  }

  public tryConsume(nowMs: number): number {
    this._refill(nowMs);

    if (this._tokens >= 1) {
      this._tokens -= 1;

      return 0;
    }

    return Math.ceil(((1 - this._tokens) / this._ratePerSecond) * MS_PER_SECOND);
  }

  public isFull(nowMs: number): boolean {
    this._refill(nowMs);

    return this._tokens >= this._ratePerSecond;
  }

  private _refill(nowMs: number): void {
    const elapsedMs: number = Math.max(0, nowMs - this._updatedAt);

    this._tokens = Math.min(this._ratePerSecond, this._tokens + (elapsedMs / MS_PER_SECOND) * this._ratePerSecond);
    this._updatedAt = nowMs;
  }
}
