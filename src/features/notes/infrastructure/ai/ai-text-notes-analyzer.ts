/*
 * Funcionalidad: Adaptador AITextNotesAnalyzer
 * Descripción: Implementa INotesAnalyzer sobre el puerto común IAITextGenerator (Gemini): construye el prompt, genera el texto y parsea el JSON; los errores de disponibilidad o generación de la IA se propagan sin resultado simulado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  AI_TEXT_GENERATOR_TOKEN,
  type AITextGenerationResult,
  type IAITextGenerator,
} from "@/common/application/ports/ai-text-generator.interface";
import { type INotesAnalyzer, type NotesAnalysisContext, type NotesAnalysisNote } from "@/features/notes/application/ports/notes-analyzer.interface";
import { type NotesAnalysis, type NotesAnalysisContent } from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { buildNotesAnalysisPrompt } from "@/features/notes/infrastructure/ai/notes-analysis-prompt";
import { parseNotesAnalysisResponse } from "@/features/notes/infrastructure/ai/notes-analysis-response.parser";

const ANALYSIS_TEMPERATURE: number = 0.3;
const ANALYSIS_MAX_TOKENS: number = 1500;

@Injectable()
export class AITextNotesAnalyzer implements INotesAnalyzer {
  public constructor(
    @Inject(AI_TEXT_GENERATOR_TOKEN)
    private readonly _aiTextGenerator: IAITextGenerator,
  ) {}

  public async analyze(notes: NotesAnalysisNote[], context: NotesAnalysisContext): Promise<NotesAnalysis> {
    const prompt: string = buildNotesAnalysisPrompt(notes, context);

    const result: AITextGenerationResult = await this._aiTextGenerator.generate(prompt, {
      temperature: ANALYSIS_TEMPERATURE,
      maxTokens: ANALYSIS_MAX_TOKENS,
    });

    const content: NotesAnalysisContent = parseNotesAnalysisResponse(result.text);

    return { ...content, model: result.model };
  }
}
