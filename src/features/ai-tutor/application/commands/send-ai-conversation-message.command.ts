/*
 * Funcionalidad: Comando SendAiConversationMessage
 * Descripción: Datos para enviar un nuevo mensaje a una conversación propia del tutor de IA: llamador, conversación, mensaje, página actual opcional y señal de cancelación de la conexión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TutorCaller } from "@/features/ai-tutor/application/commands/tutor-caller";

export class SendAiConversationMessageCommand {
  public readonly caller: TutorCaller;
  public readonly conversationId: string;
  public readonly message: string;
  public readonly currentPageId?: string;
  public readonly signal?: AbortSignal;

  public constructor({
    caller,
    conversationId,
    message,
    currentPageId,
    signal,
  }: {
    caller: TutorCaller;
    conversationId: string;
    message: string;
    currentPageId?: string;
    signal?: AbortSignal;
  }) {
    this.caller = caller;
    this.conversationId = conversationId;
    this.message = message;
    this.currentPageId = currentPageId;
    this.signal = signal;
  }
}
