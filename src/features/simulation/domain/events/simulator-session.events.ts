/*
 * Funcionalidad: Eventos de SimulatorSession
 * Descripción: Evento de dominio emitido cuando se abre o se guarda una sesión del simulador
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainEvent } from "@/common/domain/events/domain-event";
import { type SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";

export class SimulatorSessionCreatedEvent extends DomainEvent {
  public readonly entity: SimulatorSession;

  public constructor({ entity, performedBy }: { entity: SimulatorSession; performedBy?: string }) {
    super({ performedBy });
    this.entity = entity;
  }
}
