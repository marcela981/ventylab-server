/*
 * Funcionalidad: Comando CreateReservationCommand
 * Descripción: Intención de programar una reserva del ventilador para el propio usuario, otro usuario o un grupo, con confirmación opcional para desplazar reservas de estudiantes y su motivo; sin inicio es una reserva inmediata (desde ahora, truncado al minuto, por una duración)
 * Versión: 1.1
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
  /** Undefined for an immediate reservation, which starts now (truncated to the minute) and lasts durationMinutes */
  public readonly startsAt?: Date;
  public readonly endsAt?: Date;
  public readonly durationMinutes?: number;
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
    durationMinutes,
    purpose,
    confirmPreempt,
    preemptReason,
  }: {
    actorId: string;
    actorRole: string;
    holderType: string;
    userId?: string;
    groupId?: string;
    startsAt?: Date;
    endsAt?: Date;
    durationMinutes?: number;
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
    this.durationMinutes = durationMinutes;
    this.purpose = purpose;
    this.confirmPreempt = confirmPreempt;
    this.preemptReason = preemptReason;
  }
}
