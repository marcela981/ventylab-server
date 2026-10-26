/*
 * Funcionalidad: Eventos WebSocket del ventilador
 * Descripción: Nombres de los eventos Socket.io que emite la simulación (lecturas del paciente simulado). v1.2: sin ventilator:reserved ni ventilator:released, que difundían userId y userName a sockets no autenticados y no tenían oyentes
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const VENTILATOR_DATA_EVENT: string = "ventilator:data";
