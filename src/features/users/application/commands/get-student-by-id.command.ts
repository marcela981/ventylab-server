/*
 * Funcionalidad: Comando GetStudentByIdCommand
 * Descripción: Datos de entrada para consultar un estudiante con el contexto del solicitante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class GetStudentByIdCommand {
  public readonly studentId: string;
  public readonly requesterId: string;
  public readonly requesterRole: string;

  public constructor({
    studentId,
    requesterId,
    requesterRole,
  }: {
    studentId: string;
    requesterId: string;
    requesterRole: string;
  }) {
    this.studentId = studentId;
    this.requesterId = requesterId;
    this.requesterRole = requesterRole;
  }
}
