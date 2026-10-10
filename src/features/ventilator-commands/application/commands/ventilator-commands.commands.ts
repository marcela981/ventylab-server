/*
 * Funcionalidad: Comandos de la feature de comandos del ventilador
 * Descripción: Intenciones de enviar un comando al ventilador físico (parámetros aún sin validar), de actuar sobre el control exclusivo (consultar, tomar, arrebatar, liberar, latido) y de consultar el historial de comandos de una reserva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SendVentilatorCommandCommand {
  public readonly userId: string;
  public readonly role: string;
  public readonly params: unknown;

  public constructor({ userId, role, params }: { userId: string; role: string; params: unknown }) {
    this.userId = userId;
    this.role = role;
    this.params = params;
  }
}

export class VentilatorControlCommand {
  public readonly userId: string;
  public readonly role: string;

  public constructor({ userId, role }: { userId: string; role: string }) {
    this.userId = userId;
    this.role = role;
  }
}

export class GetVentilatorCommandsCommand {
  public readonly userId: string;
  public readonly role: string;
  public readonly reservationId: string;
  public readonly page: number;
  public readonly limit: number;
  public readonly sortOrder?: "asc" | "desc";

  public constructor({
    userId,
    role,
    reservationId,
    page,
    limit,
    sortOrder,
  }: {
    userId: string;
    role: string;
    reservationId: string;
    page: number;
    limit: number;
    sortOrder?: "asc" | "desc";
  }) {
    this.userId = userId;
    this.role = role;
    this.reservationId = reservationId;
    this.page = page;
    this.limit = limit;
    this.sortOrder = sortOrder;
  }
}
