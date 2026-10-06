/*
 * Funcionalidad: Puerto IEventBus
 * Descripción: Define el contrato y el token de inyección del bus de eventos de dominio usado por los casos de uso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";

export const EVENT_BUS_TOKEN: unique symbol = Symbol("EVENT_BUS_TOKEN");

export interface IEventBus {
  publish(events: DomainEvent[]): void;
}
