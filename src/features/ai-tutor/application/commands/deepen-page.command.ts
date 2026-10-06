/*
 * Funcionalidad: Comando DeepenPage
 * Descripción: Datos para profundizar una página con el tutor de IA: llamador, página, pregunta opcional, conversación de página existente opcional y señal de cancelación de la conexión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TutorCaller } from "@/features/ai-tutor/application/commands/tutor-caller";

export class DeepenPageCommand {
  public readonly caller: TutorCaller;
  public readonly pageId: string;
  public readonly question?: string;
  public readonly conversationId?: string;
  public readonly signal?: AbortSignal;

  public constructor({
    caller,
    pageId,
    question,
    conversationId,
    signal,
  }: {
    caller: TutorCaller;
    pageId: string;
    question?: string;
    conversationId?: string;
    signal?: AbortSignal;
  }) {
    this.caller = caller;
    this.pageId = pageId;
    this.question = question;
    this.conversationId = conversationId;
    this.signal = signal;
  }
}
