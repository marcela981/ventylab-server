/*
 * Funcionalidad: Cubo de fichas
 * Descripción: Limitador de frecuencia puro con capacidad igual a la tasa por segundo y recarga continua y tasa consultable, y una copia con otra tasa que conserva sus fichas actuales recortadas a la nueva capacidad; indica cuántos milisegundos esperar cuando no queda una ficha
 * Versión: 1.2
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
    initialTokens: number = _ratePerSecond,
  ) {
    this._tokens = Math.min(_ratePerSecond, initialTokens);
    this._updatedAt = nowMs;
  }

  public get ratePerSecond(): number {
    return this._ratePerSecond;
  }

  public tryConsume(nowMs: number): number {
    this._refill(nowMs);

    if (this._tokens >= 1) {
      this._tokens -= 1;

      return 0;
    }

    return Math.ceil(((1 - this._tokens) / this._ratePerSecond) * MS_PER_SECOND);
  }

  public withRate(ratePerSecond: number, nowMs: number): TokenBucket {
    this._refill(nowMs);

    return new TokenBucket(ratePerSecond, nowMs, this._tokens);
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
