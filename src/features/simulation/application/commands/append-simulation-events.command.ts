/*
 * Funcionalidad: Comando AppendSimulationEventsCommand
 * Descripción: Intención de registrar un lote de eventos del cliente (PARAM_CHANGE o ALARM_ACK con id propio, tiempo simulado y payload) en una sesión de simulación del actor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClientSimulationEvent } from "@/features/simulation/domain/sessions/simulation-session-events";

export class AppendSimulationEventsCommand {
  public readonly sessionId: string;
  public readonly userId: string;
  public readonly events: readonly ClientSimulationEvent[];

  public constructor({ sessionId, userId, events }: { sessionId: string; userId: string; events: readonly ClientSimulationEvent[] }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.events = events;
  }
}
