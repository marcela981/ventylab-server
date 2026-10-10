/*
 * Funcionalidad: Comando CreateReservationCommand
 * Descripción: Intención de programar una reserva del ventilador para el propio usuario, otro usuario o un grupo, con confirmación opcional para desplazar reservas de estudiantes y su motivo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class CreateReservationCommand {
  public readonly actorId: string;
  public readonly actorRole: string;
  public readonly holderType: string;
  public readonly userId?: string;
  public readonly groupId?: string;
  public readonly startsAt: Date;
  public readonly endsAt: Date;
  public readonly purpose?: string;
  public readonly confirmPreempt: boolean;
  public readonly preemptReason?: string;

  public constructor({
    actorId,
    actorRole,
    holderType,
    userId,
    groupId,
    startsAt,
    endsAt,
    purpose,
    confirmPreempt,
    preemptReason,
  }: {
    actorId: string;
    actorRole: string;
    holderType: string;
    userId?: string;
    groupId?: string;
    startsAt: Date;
    endsAt: Date;
    purpose?: string;
    confirmPreempt: boolean;
    preemptReason?: string;
  }) {
    this.actorId = actorId;
    this.actorRole = actorRole;
    this.holderType = holderType;
    this.userId = userId;
    this.groupId = groupId;
    this.startsAt = startsAt;
    this.endsAt = endsAt;
    this.purpose = purpose;
    this.confirmPreempt = confirmPreempt;
    this.preemptReason = preemptReason;
  }
}
