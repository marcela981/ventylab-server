/*
 * Funcionalidad: Comando StartSimulationSessionCommand
 * Descripción: Intención de iniciar una sesión de simulación con eventos: actor, modo FREE o EXAM, caso (solo modo libre), intento y pregunta de examen y multiplicador de tiempo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TimeMultiplier } from "@/features/simulation/domain/engine";
import { type SimulationModeValue } from "@/features/simulation/domain/value-objects/simulation-session-values";

export class StartSimulationSessionCommand {
  public readonly userId: string;
  public readonly mode: SimulationModeValue;
  public readonly caseId?: string;
  public readonly attemptId?: string;
  public readonly questionId?: string;
  public readonly timeMultiplier: TimeMultiplier;

  public constructor({
    userId,
    mode,
    caseId,
    attemptId,
    questionId,
    timeMultiplier,
  }: {
    userId: string;
    mode: SimulationModeValue;
    caseId?: string;
    attemptId?: string;
    questionId?: string;
    timeMultiplier: TimeMultiplier;
  }) {
    this.userId = userId;
    this.mode = mode;
    this.caseId = caseId;
    this.attemptId = attemptId;
    this.questionId = questionId;
    this.timeMultiplier = timeMultiplier;
  }
}
