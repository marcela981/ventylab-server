/*
 * Funcionalidad: Comando ReserveVentilatorCommand
 * Descripción: Intención de reservar el ventilador físico por una duración, opcionalmente para un grupo y con un líder que recibe la telemetría
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ReserveVentilatorCommand {
  public readonly userId: string;
  public readonly userRole: string;
  public readonly durationMinutes: number;
  public readonly purpose?: string;
  public readonly groupId?: string;
  public readonly leaderId?: string;

  public constructor({
    userId,
    userRole,
    durationMinutes,
    purpose,
    groupId,
    leaderId,
  }: {
    userId: string;
    userRole: string;
    durationMinutes: number;
    purpose?: string;
    groupId?: string;
    leaderId?: string;
  }) {
    this.userId = userId;
    this.userRole = userRole;
    this.durationMinutes = durationMinutes;
    this.purpose = purpose;
    this.groupId = groupId;
    this.leaderId = leaderId;
  }
}
