/*
 * Funcionalidad: Resultado ReserveNowResult
 * Descripción: Desenlace de la reserva inmediata heredada: reserva creada o recuperada (con titular, nombre, grupo y ventana) u ocupación del ventilador por otro titular
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface ReservedNowOutcome {
  readonly kind: "reserved";
  readonly reservationId: string;
  readonly holderUserId: string;
  readonly holderName?: string;
  readonly groupId?: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly recovered: boolean;
}

export interface OccupiedOutcome {
  readonly kind: "occupied";
}

export type ReserveNowResult = ReservedNowOutcome | OccupiedOutcome;
