/*
 * Funcionalidad: Detector de huecos de secuencia
 * Descripción: Cuenta los mensajes perdidos a partir del número de secuencia de las tramas del ventilador (suma salto - 1 y se reinicia cuando la secuencia retrocede, por ejemplo tras reiniciar el dispositivo)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SequenceGapTracker {
  private _lastSeq: number | undefined;

  public observe(seq: number | undefined): number {
    if (seq === undefined) {
      return 0;
    }

    const last: number | undefined = this._lastSeq;

    this._lastSeq = seq;

    if (last === undefined || seq <= last) {
      return 0;
    }

    return seq - last - 1;
  }

  public reset(): void {
    this._lastSeq = undefined;
  }
}
