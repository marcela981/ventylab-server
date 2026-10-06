/*
 * Funcionalidad: Comando GenerateGradeFeedbackCommand
 * Descripción: Intención de generar la retroalimentación de un intento calificado; con pendingFeedbackId completa la fila PENDING ya reservada por una regeneración en lugar de reservar una nueva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class GenerateGradeFeedbackCommand {
  public readonly attemptId: string;
  public readonly pendingFeedbackId?: string;

  public constructor({ attemptId, pendingFeedbackId }: { attemptId: string; pendingFeedbackId?: string }) {
    this.attemptId = attemptId;
    this.pendingFeedbackId = pendingFeedbackId;
  }
}
