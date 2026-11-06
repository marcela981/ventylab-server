/*
 * Funcionalidad: Comando de asistencia de simulación
 * Descripción: Datos para pedir asistencia de IA sobre una sesión de simulación activa: sesión, actor (id y rol para la cuota), pregunta opcional del estudiante, idioma de la respuesta, tiempo simulado actual de la consola con lo que muestra (para compararlo con la repetición del servidor), si quedaron cambios sin enviar y señal de cancelación cuando el cliente se desconecta
 * Versión: 1.1 (tiempo simulado y foto de la consola)
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";
import { type ClientAssistSnapshot } from "@/features/simulation/domain/assist/assist-context-check";

export class AssistSimulationCommand {
  public readonly sessionId: string;
  public readonly userId: string;
  public readonly userRole: string;
  public readonly question?: string;
  public readonly language: LanguageValue;
  public readonly signal?: AbortSignal;
  public readonly simTimeMs?: number;
  public readonly clientSnapshot?: ClientAssistSnapshot;
  public readonly unsentChanges?: boolean;

  public constructor({
    sessionId,
    userId,
    userRole,
    question,
    language,
    signal,
    simTimeMs,
    clientSnapshot,
    unsentChanges,
  }: {
    sessionId: string;
    userId: string;
    userRole: string;
    question?: string;
    language: LanguageValue;
    signal?: AbortSignal;
    simTimeMs?: number;
    clientSnapshot?: ClientAssistSnapshot;
    unsentChanges?: boolean;
  }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userRole = userRole;
    this.question = question;
    this.language = language;
    this.signal = signal;
    this.simTimeMs = simTimeMs;
    this.clientSnapshot = clientSnapshot;
    this.unsentChanges = unsentChanges;
  }
}
