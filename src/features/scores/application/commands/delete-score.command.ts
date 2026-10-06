/*
 * Funcionalidad: Comando DeleteScoreCommand
 * Descripción: Datos para que el profesor que asignó una calificación la elimine
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class DeleteScoreCommand {
  public readonly scoreId: string;
  public readonly performedBy: string;

  public constructor({ scoreId, performedBy }: { scoreId: string; performedBy: string }) {
    this.scoreId = scoreId;
    this.performedBy = performedBy;
  }
}
