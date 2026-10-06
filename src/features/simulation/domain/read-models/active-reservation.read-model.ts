/*
 * Funcionalidad: Vista de la reserva activa
 * Descripción: Reserva activa del ventilador junto con el nombre (o correo) de quien la tiene, como la leía el servicio heredado al unir la tabla de usuarios
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorReservation } from "@/features/simulation/domain/entities/ventilator-reservation.entity";

export interface ActiveReservationView {
  reservation: VentilatorReservation;
  holderName?: string;
}
