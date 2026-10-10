/*
 * Funcionalidad: Reloj del sistema para reservas
 * Descripción: Implementación de IReservationClock que devuelve la hora actual del proceso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type IReservationClock } from "@/features/reservations/application/ports/reservation-clock.interface";

@Injectable()
export class SystemReservationClock implements IReservationClock {
  public now(): Date {
    return new Date();
  }
}
