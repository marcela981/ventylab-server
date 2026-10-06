/*
 * Funcionalidad: Comando SaveSubmissionDraftCommand
 * Descripción: Datos para guardar el contenido en borrador de la entrega propia de un estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SaveSubmissionDraftCommand {
  public readonly submissionId: string;
  public readonly userId: string;
  public readonly requesterRole: string;
  public readonly content: unknown;

  public constructor({
    submissionId,
    userId,
    requesterRole,
    content,
  }: {
    submissionId: string;
    userId: string;
    requesterRole: string;
    content: unknown;
  }) {
    this.submissionId = submissionId;
    this.userId = userId;
    this.requesterRole = requesterRole;
    this.content = content;
  }
}
