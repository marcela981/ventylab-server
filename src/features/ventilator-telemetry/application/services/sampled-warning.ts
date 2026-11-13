/*
 * Funcionalidad: Advertencia muestreada del pipeline de telemetría
 * Descripción: Registra una advertencia como máximo una vez por intervalo (VENTILATOR_INVALID_LOG_INTERVAL_MS, leído en cada llamada) e informa en la siguiente advertencia cuántas se suprimieron, para que los descartes del camino caliente nunca sean silenciosos sin inundar los registros
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SampledWarning {
  private _lastLoggedAt: number | undefined;
  private _suppressed: number = 0;

  public constructor(
    private readonly _intervalMs: () => number,
    private readonly _log: (message: string) => void,
  ) {}

  public warn(message: string, now: number): void {
    const last: number | undefined = this._lastLoggedAt;

    if (last !== undefined && now - last < this._intervalMs()) {
      this._suppressed++;

      return;
    }

    const suppressed: string = this._suppressed > 0 ? ` (${this._suppressed} similar messages suppressed)` : "";

    this._log(`${message}${suppressed}`);
    this._lastLoggedAt = now;
    this._suppressed = 0;
  }
}
