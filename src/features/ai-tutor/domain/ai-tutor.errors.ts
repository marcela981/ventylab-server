/*
 * Funcionalidad: Errores del tutor de IA
 * Descripción: Errores de dominio del tutor de IA: conversación no encontrada o de otro usuario (404), referencia obligatoria para conversaciones de lección o módulo (400) y conversación que no corresponde a la página indicada (400)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class AiConversationNotFoundError extends DomainError {
  public constructor() {
    super("Conversation not found", "ai-tutor.conversation_not_found");
  }
}

export class AiConversationRefRequiredError extends DomainError {
  public constructor() {
    super("Lesson and module conversations need the id of the lesson or module", "ai-tutor.ref_required");
  }
}

export class AiConversationPageMismatchError extends DomainError {
  public constructor() {
    super("The conversation does not belong to this page", "ai-tutor.conversation_page_mismatch");
  }
}
