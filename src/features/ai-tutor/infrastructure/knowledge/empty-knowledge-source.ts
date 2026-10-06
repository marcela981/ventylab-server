/*
 * Funcionalidad: Fuente de conocimiento vacía
 * Descripción: Implementación por defecto de IKnowledgeSource que no aporta fragmentos; se reemplaza por una fuente real (por ejemplo, recuperación de documentos) registrando otra clase en KNOWLEDGE_SOURCE_TOKEN
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type IKnowledgeSource, type KnowledgeFragment, type KnowledgeScope } from "@/features/ai-tutor/application/ports/knowledge-source.interface";

@Injectable()
export class EmptyKnowledgeSource implements IKnowledgeSource {
  public retrieve(_query: string, _scope: KnowledgeScope): Promise<KnowledgeFragment[]> {
    return Promise.resolve([]);
  }
}
