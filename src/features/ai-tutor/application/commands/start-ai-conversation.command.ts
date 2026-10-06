/*
 * Funcionalidad: Comando StartAiConversation
 * Descripción: Datos para iniciar una conversación con el tutor de IA: llamador, alcance (libre, lección o módulo), referencia, primer mensaje, página actual opcional y señal de cancelación de la conexión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TutorCaller } from "@/features/ai-tutor/application/commands/tutor-caller";
import { type AiConversationScopeValue } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export class StartAiConversationCommand {
  public readonly caller: TutorCaller;
  public readonly scope: AiConversationScopeValue;
  public readonly refId?: string;
  public readonly message: string;
  public readonly currentPageId?: string;
  public readonly signal?: AbortSignal;

  public constructor({
    caller,
    scope,
    refId,
    message,
    currentPageId,
    signal,
  }: {
    caller: TutorCaller;
    scope: AiConversationScopeValue;
    refId?: string;
    message: string;
    currentPageId?: string;
    signal?: AbortSignal;
  }) {
    this.caller = caller;
    this.scope = scope;
    this.refId = refId;
    this.message = message;
    this.currentPageId = currentPageId;
    this.signal = signal;
  }
}
