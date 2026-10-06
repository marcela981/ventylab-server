/*
 * Funcionalidad: Módulo NotesModule
 * Descripción: Registra la feature de notas privadas (controlador, casos de uso, repositorio Prisma y analizador de notas sobre IAITextGenerator)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { NOTES_ANALYZER_TOKEN } from "@/features/notes/application/ports/notes-analyzer.interface";
import { AnalyzeNotesUseCase } from "@/features/notes/application/use-cases/analyze-notes.usecase";
import { CreateNoteUseCase } from "@/features/notes/application/use-cases/create-note.usecase";
import { DeleteNoteUseCase } from "@/features/notes/application/use-cases/delete-note.usecase";
import { GetNoteUseCase } from "@/features/notes/application/use-cases/get-note.usecase";
import { GetNotesUseCase } from "@/features/notes/application/use-cases/get-notes.usecase";
import { UpdateNoteUseCase } from "@/features/notes/application/use-cases/update-note.usecase";
import { NOTES_REPOSITORY_TOKEN } from "@/features/notes/domain/repositories/notes.repository";
import { AITextNotesAnalyzer } from "@/features/notes/infrastructure/ai/ai-text-notes-analyzer";
import { NotesPrismaRepository } from "@/features/notes/infrastructure/persistence/prisma/repositories/notes-prisma.repository";
import { NotesController } from "@/features/notes/presentation/controllers/notes.controller";

@Module({
  imports: [AuthModule],
  controllers: [NotesController],
  providers: [
    {
      provide: NOTES_REPOSITORY_TOKEN,
      useClass: NotesPrismaRepository,
    },
    {
      provide: NOTES_ANALYZER_TOKEN,
      useClass: AITextNotesAnalyzer,
    },
    GetNotesUseCase,
    GetNoteUseCase,
    CreateNoteUseCase,
    UpdateNoteUseCase,
    DeleteNoteUseCase,
    AnalyzeNotesUseCase,
  ],
})
export class NotesModule {}
