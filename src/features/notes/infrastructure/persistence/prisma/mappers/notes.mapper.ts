/*
 * Funcionalidad: Mapper de persistencia de notas
 * Descripción: Convierte entre la fila Prisma de la tabla notes y la entidad Note, reconstituyendo el contenido Tiptap como NoteContent
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Note as NoteModel, type Prisma } from "@prisma/client";

import { Note } from "@/features/notes/domain/entities/note.entity";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

export class NotesMapper {
  public static toDomain(row: NoteModel): Note {
    return Note.reconstitute({
      id: row.id,
      userId: row.userId,
      lessonId: row.lessonId,
      pageId: row.pageId ?? undefined,
      content: NoteContent.reconstitute(row.content),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toPersistence(note: Note): Prisma.NoteUncheckedCreateInput {
    return {
      id: note.id,
      userId: note.userId,
      lessonId: note.lessonId,
      pageId: note.pageId ?? null,
      content: note.content.document as unknown as Prisma.InputJsonObject,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
