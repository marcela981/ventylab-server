/*
 * Funcionalidad: Puerto IKnowledgeSource
 * Descripción: Contrato de una fuente de conocimiento adicional (por ejemplo, recuperación de documentos) que entrega fragmentos de texto con su referencia para enriquecer el contexto del tutor según la consulta y el alcance
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiConversationScopeValue } from "@/features/ai-tutor/domain/value-objects/ai-conversation-scope";

export const KNOWLEDGE_SOURCE_TOKEN: unique symbol = Symbol("KNOWLEDGE_SOURCE_TOKEN");

export interface KnowledgeScope {
  readonly scope: AiConversationScopeValue;
  readonly refId?: string;
}

export interface KnowledgeFragment {
  readonly text: string;
  readonly sourceRef: string;
}

export interface IKnowledgeSource {
  retrieve(query: string, scope: KnowledgeScope): Promise<KnowledgeFragment[]>;
}
