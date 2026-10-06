/*
 * Funcionalidad: Módulo AIModule
 * Descripción: Módulo global que enlaza el puerto IAITextGenerator con el adaptador de Gemini
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { AI_TEXT_GENERATOR_TOKEN } from "@/common/application/ports/ai-text-generator.interface";
import { GeminiAITextGenerator } from "@/common/infrastructure/ai/gemini-ai-text-generator";

@Global()
@Module({
  providers: [
    {
      provide: AI_TEXT_GENERATOR_TOKEN,
      useClass: GeminiAITextGenerator,
    },
  ],
  exports: [AI_TEXT_GENERATOR_TOKEN],
})
export class AIModule {}
