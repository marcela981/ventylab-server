/*
 * Funcionalidad: Comando EndSimulationSessionCommand
 * Descripción: Intención de terminar una sesión de simulación del actor, opcionalmente con el tiempo simulado final; la calificación se calcula siempre en el servidor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class EndSimulationSessionCommand {
  public readonly sessionId: string;
  public readonly userId: string;
  public readonly simTimeMs?: number;

  public constructor({ sessionId, userId, simTimeMs }: { sessionId: string; userId: string; simTimeMs?: number }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.simTimeMs = simTimeMs;
  }
}
