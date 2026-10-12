/*
 * Funcionalidad: Pruebas de NotesFacade
 * Descripción: Verifica que las últimas notas de un usuario se piden en una sola página ordenada de la más reciente a la más antigua y se exponen con un extracto acotado de su texto plano
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import { NOTE_EXCERPT_LENGTH, NotesFacade, type NoteSummary } from "@/features/notes/application/services/notes.facade";
import { Note } from "@/features/notes/domain/entities/note.entity";
import { type INotesRepository } from "@/features/notes/domain/repositories/notes.repository";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

const CREATED_AT: Date = new Date("2026-10-10T10:00:00.000Z");

describe("NotesFacade", () => {
  it("returns the latest notes of a user with a bounded plain-text excerpt", async () => {
    const text: string = "PEEP ".repeat(100).trim();
    const note: Note = Note.reconstitute({
      id: "note-1",
      userId: "student-1",
      lessonId: "lesson-1",
      content: NoteContent.reconstitute({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }),
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
    const getAll: jest.Mock = jest.fn().mockResolvedValue(new Paginated<Note>({ items: [note], total: 1, page: 1, limit: 5 }));
    const facade: NotesFacade = new NotesFacade({ getAll } as unknown as INotesRepository);

    const notes: NoteSummary[] = await facade.getLatestNotes("student-1", 5);

    expect(getAll).toHaveBeenCalledWith({ userId: "student-1", page: 1, limit: 5, sortOrder: "desc" });
    expect(notes).toEqual([{ id: "note-1", lessonId: "lesson-1", pageId: undefined, excerpt: text.slice(0, NOTE_EXCERPT_LENGTH), createdAt: CREATED_AT, updatedAt: CREATED_AT }]);
  });
});
