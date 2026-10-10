/*
 * Funcionalidad: Comando ReserveNowCommand
 * Descripción: Intención heredada de reservar el ventilador desde ahora por una duración, opcionalmente para un grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ReserveNowCommand {
  public readonly userId: string;
  public readonly role: string;
  public readonly durationMinutes: number;
  public readonly groupId?: string;
  public readonly purpose?: string;

  public constructor({
    userId,
    role,
    durationMinutes,
    groupId,
    purpose,
  }: {
    userId: string;
    role: string;
    durationMinutes: number;
    groupId?: string;
    purpose?: string;
  }) {
    this.userId = userId;
    this.role = role;
    this.durationMinutes = durationMinutes;
    this.groupId = groupId;
    this.purpose = purpose;
  }
}
