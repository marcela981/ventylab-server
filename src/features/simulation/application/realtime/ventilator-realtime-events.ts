/*
 * Funcionalidad: Eventos WebSocket del ventilador
 * Descripción: Nombres de los eventos Socket.io que emite la simulación (lecturas, alarmas, reserva y liberación del ventilador) y la clave de difusión usada por el limitador de frecuencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const VENTILATOR_DATA_EVENT: string = "ventilator:data";
export const VENTILATOR_ALARM_EVENT: string = "ventilator:alarm";
export const VENTILATOR_RESERVED_EVENT: string = "ventilator:reserved";
export const VENTILATOR_RELEASED_EVENT: string = "ventilator:released";

export const BROADCAST_THROTTLE_KEY: string = "__broadcast__";
