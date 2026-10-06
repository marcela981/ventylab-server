/*
 * Funcionalidad: Caso de uso AnalyzeNotesUseCase
 * Descripción: Analiza con IA (puerto INotesAnalyzer) las notas propias más recientes del usuario en una lección, un módulo o en todas sus notas, convirtiéndolas a texto plano con los títulos de lección y módulo; pasa el usuario y su rol al analizador para cuotas y telemetría; sin respaldo simulado cuando la IA falla
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { AnalyzeNotesCommand } from "@/features/notes/application/commands/analyze-notes.command";
import {
  type INotesAnalyzer,
  NOTES_ANALYZER_TOKEN,
  type NotesAnalysisContext,
  type NotesAnalysisNote,
} from "@/features/notes/application/ports/notes-analyzer.interface";
import { NotesAnalysisResult } from "@/features/notes/application/results/notes-analysis.result";
import {
  InvalidNotesAnalysisScopeError,
  NoNotesToAnalyzeError,
  NoteLessonNotFoundError,
  NoteModuleNotFoundError,
} from "@/features/notes/domain/notes.errors";
import { type NoteAnalysisSource, type NoteLessonScope, type NoteModuleScope } from "@/features/notes/domain/read-models/note-scope.read-model";
import {
  ALL_ANALYSIS_SCOPE,
  LESSON_ANALYSIS_SCOPE,
  MODULE_ANALYSIS_SCOPE,
  type NotesAnalysis,
} from "@/features/notes/domain/read-models/notes-analysis.read-model";
import { type INotesRepository, NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";

export const MAX_ANALYZED_NOTES: number = 50;

/**
 * @throws {InvalidNotesAnalysisScopeError} If both a lesson and a module are given
 * @throws {NoteLessonNotFoundError} If the lesson does not exist
 * @throws {NoteModuleNotFoundError} If the module does not exist
 * @throws {NoNotesToAnalyzeError} If the user has no notes with text in the scope
 * @throws {AiQuotaExceededError} If the user reached the daily AI usage quota
 * @throws {AiProvidersUnavailableError} If no AI provider is available
 * @throws {NotesAnalysisInvalidResponseError} If the AI response cannot be parsed into an analysis
 */
@Injectable()
export class AnalyzeNotesUseCase {
  public constructor(
    @Inject(NOTES_REPOSITORY_TOKEN)
    private readonly _notesRepository: INotesRepository,
    @Inject(NOTES_ANALYZER_TOKEN)
    private readonly _notesAnalyzer: INotesAnalyzer,
  ) {}

  public async execute(command: AnalyzeNotesCommand): Promise<NotesAnalysisResult> {
    const { userId, userRole, lessonId, moduleId, language } = command;

    if (lessonId !== undefined && moduleId !== undefined) {
      throw new InvalidNotesAnalysisScopeError();
    }

    const context: NotesAnalysisContext = await this._resolveContext(lessonId, moduleId, language);

    const sources: NoteAnalysisSource[] = await this._notesRepository.getForAnalysis({
      userId,
      lessonId,
      moduleId,
      limit: MAX_ANALYZED_NOTES,
    });

    const notes: NotesAnalysisNote[] = sources
      .filter((source: NoteAnalysisSource) => source.content.plainText.length > 0)
      .map((source: NoteAnalysisSource) => ({
        lessonTitle: source.lessonTitle,
        moduleTitle: source.moduleTitle,
        text: source.content.plainText,
      }));

    if (notes.length === 0) {
      throw new NoNotesToAnalyzeError();
    }

    const analysis: NotesAnalysis = await this._notesAnalyzer.analyze(notes, { ...context, userId, userRole });

    return new NotesAnalysisResult({
      scope: context.scope,
      lessonId,
      moduleId,
      notesAnalyzed: notes.length,
      analysis,
    });
  }

  private async _resolveContext(
    lessonId: string | undefined,
    moduleId: string | undefined,
    language: NotesAnalysisContext["language"],
  ): Promise<NotesAnalysisContext> {
    if (lessonId !== undefined) {
      const lesson: NoteLessonScope | undefined = await this._notesRepository.getLessonScope(lessonId);

      if (!lesson) {
        throw new NoteLessonNotFoundError();
      }

      return { scope: LESSON_ANALYSIS_SCOPE, lessonTitle: lesson.lessonTitle, moduleTitle: lesson.moduleTitle, language };
    }

    if (moduleId !== undefined) {
      const module: NoteModuleScope | undefined = await this._notesRepository.getModuleScope(moduleId);

      if (!module) {
        throw new NoteModuleNotFoundError();
      }

      return { scope: MODULE_ANALYSIS_SCOPE, moduleTitle: module.moduleTitle, language };
    }

    return { scope: ALL_ANALYSIS_SCOPE, language };
  }
}
