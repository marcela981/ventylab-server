/*
 * Funcionalidad: Resultado ReserveVentilatorResult
 * Descripción: Reserva creada o recuperada (cuando el mismo usuario ya la tenía) con su ventana de tiempo en milisegundos epoch
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class ReserveVentilatorResult {
  public readonly reservationId: string;
  public readonly startTime: number;
  public readonly endTime: number;
  public readonly recovered: boolean;

  public constructor({
    reservationId,
    startTime,
    endTime,
    recovered,
  }: {
    reservationId: string;
    startTime: number;
    endTime: number;
    recovered: boolean;
  }) {
    this.reservationId = reservationId;
    this.startTime = startTime;
    this.endTime = endTime;
    this.recovered = recovered;
  }
}
