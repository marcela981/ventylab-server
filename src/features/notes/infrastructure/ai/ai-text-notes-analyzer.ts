/*
 * Funcionalidad: Adaptador AITextNotesAnalyzer
 * Descripción: Implementa INotesAnalyzer sobre el gateway de IA (caso NOTES_ANALYSIS; usuario y rol solo para cuota y telemetría): parsea el JSON y devuelve el análisis con el modelo, el id de la llamada y source LLM; cuando ningún proveedor responde entrega el análisis por reglas sin IA (respaldo del consumidor, telemetría FALLBACK, source DETERMINISTIC); la cuota (429) y la respuesta inválida de un proveedor (502) se propagan. v1.3: entrada estructurada del prompt versionado del registro (NOTES_ANALYSIS 2.0.0) y el nombre y el correo del estudiante se eliminan de sus notas antes de enviarlas al proveedor
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { AiGateway } from "@/features/ai/application/services/ai-gateway";
import { type NotesAnalysisPromptInput } from "@/features/ai/domain/prompts/notes-analysis-prompt";
import { redactableNameTokens, redactPersonalData } from "@/features/ai/domain/prompts/personal-data-guard";
import { type AiResult } from "@/features/ai/domain/results/ai-result";
import { type INotesAnalyzer, type NotesAnalysisContext, type NotesAnalysisNote } from "@/features/notes/application/ports/notes-analyzer.interface";
import {
  DETERMINISTIC_NOTES_ANALYSIS_SOURCE,
  LLM_NOTES_ANALYSIS_SOURCE,
  type NotesAnalysis,
  type NotesAnalysisContent,
} from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { buildDeterministicNotesAnalysis } from "@/features/notes/domain/services/deterministic-notes-analysis";
import { parseNotesAnalysisResponse } from "@/features/notes/infrastructure/ai/notes-analysis-response.parser";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

const NOTES_ANALYSIS_REF_TYPE: string = "notes_analysis";

@Injectable()
export class AITextNotesAnalyzer implements INotesAnalyzer {
  public constructor(
    private readonly _aiGateway: AiGateway,
    private readonly _usersFacade: UsersFacade,
  ) {}

  public async analyze(notes: NotesAnalysisNote[], context: NotesAnalysisContext): Promise<NotesAnalysis> {
    const deterministic: NotesAnalysisContent = buildDeterministicNotesAnalysis({
      texts: notes.map((note: NotesAnalysisNote) => note.text),
      lessonTitle: context.lessonTitle,
      moduleTitle: context.moduleTitle,
      language: context.language,
    });
    const result: AiResult = await this._aiGateway.complete("NOTES_ANALYSIS", await this._promptInput(notes, context), {
      userId: context.userId,
      userRole: context.userRole,
      refType: NOTES_ANALYSIS_REF_TYPE,
      fallback: () => JSON.stringify(deterministic),
    });

    if (result.source !== LLM_NOTES_ANALYSIS_SOURCE) {
      return { ...deterministic, model: "", aiCallId: result.aiCallId, source: DETERMINISTIC_NOTES_ANALYSIS_SOURCE };
    }

    const content: NotesAnalysisContent = parseNotesAnalysisResponse(result.content);

    return { ...content, model: result.model ?? "", aiCallId: result.aiCallId, source: LLM_NOTES_ANALYSIS_SOURCE };
  }

  private async _promptInput(notes: NotesAnalysisNote[], context: NotesAnalysisContext): Promise<NotesAnalysisPromptInput> {
    const identifiers: string[] = await this._authorIdentifiers(context.userId);

    return {
      scope: context.scope,
      lessonTitle: context.lessonTitle,
      moduleTitle: context.moduleTitle,
      notes: notes.map((note: NotesAnalysisNote) => ({ ...note, text: redactPersonalData(note.text, identifiers) })),
      language: context.language,
    };
  }

  // Notes are free text written by the student: their own name and email are removed before they reach a provider (emails are always stripped).
  private async _authorIdentifiers(userId: string | undefined): Promise<string[]> {
    const author: UserAccount | undefined = userId ? await this._usersFacade.getUserById(userId) : undefined;

    return author ? [author.email, ...redactableNameTokens(author.name)] : [];
  }
}
