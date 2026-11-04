/*
 * Funcionalidad: Adaptador AITextNotesAnalyzer
 * Descripción: Implementa INotesAnalyzer sobre el gateway de IA (caso NOTES_ANALYSIS con el prompt del consumidor y el idioma; usuario y rol solo para cuota y telemetría): parsea el JSON y devuelve el análisis con el modelo, el id de la llamada y source LLM; v1.2: cuando ningún proveedor responde entrega el análisis por reglas sin IA (respaldo del consumidor, telemetría FALLBACK, source DETERMINISTIC) en lugar de 503; la cuota (429) y la respuesta inválida de un proveedor (502) se siguen propagando
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type INotesAnalyzer, type NotesAnalysisContext, type NotesAnalysisNote } from "@/features/notes/application/ports/notes-analyzer.interface";
import {
  DETERMINISTIC_NOTES_ANALYSIS_SOURCE,
  LLM_NOTES_ANALYSIS_SOURCE,
  type NotesAnalysis,
  type NotesAnalysisContent,
} from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { buildDeterministicNotesAnalysis } from "@/features/notes/domain/services/deterministic-notes-analysis";
import { buildNotesAnalysisPrompt } from "@/features/notes/infrastructure/ai/notes-analysis-prompt";
import { parseNotesAnalysisResponse } from "@/features/notes/infrastructure/ai/notes-analysis-response.parser";

const NOTES_ANALYSIS_REF_TYPE: string = "notes_analysis";

@Injectable()
export class AITextNotesAnalyzer implements INotesAnalyzer {
  public constructor(private readonly _aiGateway: AiGateway) {}

  public async analyze(notes: NotesAnalysisNote[], context: NotesAnalysisContext): Promise<NotesAnalysis> {
    const deterministic: NotesAnalysisContent = buildDeterministicNotesAnalysis({
      texts: notes.map((note: NotesAnalysisNote) => note.text),
      lessonTitle: context.lessonTitle,
      moduleTitle: context.moduleTitle,
      language: context.language,
    });
    const result: AiResult = await this._aiGateway.complete(
      "NOTES_ANALYSIS",
      { userPrompt: buildNotesAnalysisPrompt(notes, context), language: context.language },
      { userId: context.userId, userRole: context.userRole, refType: NOTES_ANALYSIS_REF_TYPE, fallback: () => JSON.stringify(deterministic) },
    );

    if (result.source !== LLM_NOTES_ANALYSIS_SOURCE) {
      return { ...deterministic, model: "", aiCallId: result.aiCallId, source: DETERMINISTIC_NOTES_ANALYSIS_SOURCE };
    }

    const content: NotesAnalysisContent = parseNotesAnalysisResponse(result.content);

    return { ...content, model: result.model ?? "", aiCallId: result.aiCallId, source: LLM_NOTES_ANALYSIS_SOURCE };
  }
}
