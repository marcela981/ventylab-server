/*
 * Funcionalidad: Adaptador AITextNotesAnalyzer
 * Descripción: Implementa INotesAnalyzer sobre el gateway de IA (caso NOTES_ANALYSIS con el prompt del consumidor y el idioma; usuario y rol solo para cuota y telemetría): parsea el JSON y devuelve el análisis con el modelo y el id de la llamada; sin respaldo simulado, los errores de proveedores (503), cuota (429) y respuesta inválida (502) se propagan
 * Versión: 1.1
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
import { type NotesAnalysis, type NotesAnalysisContent } from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { buildNotesAnalysisPrompt } from "@/features/notes/infrastructure/ai/notes-analysis-prompt";
import { parseNotesAnalysisResponse } from "@/features/notes/infrastructure/ai/notes-analysis-response.parser";

const NOTES_ANALYSIS_REF_TYPE: string = "notes_analysis";

@Injectable()
export class AITextNotesAnalyzer implements INotesAnalyzer {
  public constructor(private readonly _aiGateway: AiGateway) {}

  public async analyze(notes: NotesAnalysisNote[], context: NotesAnalysisContext): Promise<NotesAnalysis> {
    const result: AiResult = await this._aiGateway.complete(
      "NOTES_ANALYSIS",
      { userPrompt: buildNotesAnalysisPrompt(notes, context), language: context.language },
      { userId: context.userId, userRole: context.userRole, refType: NOTES_ANALYSIS_REF_TYPE },
    );

    const content: NotesAnalysisContent = parseNotesAnalysisResponse(result.content);

    return { ...content, model: result.model ?? "", aiCallId: result.aiCallId };
  }
}
