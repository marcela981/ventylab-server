/*
 * Funcionalidad: Comando de asistencia de simulación
 * Descripción: Datos para pedir asistencia de IA sobre una sesión de simulación activa: sesión, actor (id y rol para la cuota), pregunta opcional del estudiante, idioma de la respuesta y señal de cancelación cuando el cliente se desconecta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type LanguageValue } from "@/common/domain/value-objects/language";

export class AssistSimulationCommand {
  public readonly sessionId: string;
  public readonly userId: string;
  public readonly userRole: string;
  public readonly question?: string;
  public readonly language: LanguageValue;
  public readonly signal?: AbortSignal;

  public constructor({
    sessionId,
    userId,
    userRole,
    question,
    language,
    signal,
  }: {
    sessionId: string;
    userId: string;
    userRole: string;
    question?: string;
    language: LanguageValue;
    signal?: AbortSignal;
  }) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userRole = userRole;
    this.question = question;
    this.language = language;
    this.signal = signal;
  }
}
