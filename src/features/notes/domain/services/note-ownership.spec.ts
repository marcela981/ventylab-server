/*
 * Funcionalidad: Pruebas del servicio de propiedad de notas
 * Descripción: Verifica que solo el autor accede a su nota y que una nota ajena o inexistente se reporta como no encontrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Note } from "@/features/notes/domain/entities/note.entity";
import { NoteNotFoundError } from "@/features/notes/domain/notes.errors";
import { resolveOwnedNote } from "@/features/notes/domain/services/note-ownership";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

function buildNote(userId: string): Note {
  return Note.create({
    userId,
    lessonId: "lesson-1",
    content: NoteContent.create({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "PEEP" }] }] }),
  });
}

describe("resolveOwnedNote", () => {
  it("should return the note when the requester is its author", () => {
    const note: Note = buildNote("student-1");

    const resolved: Note = resolveOwnedNote(note, "student-1");

    expect(resolved).toBe(note);
  });

  it("should report another user's note as not found", () => {
    const note: Note = buildNote("student-1");

    const act = (): Note => resolveOwnedNote(note, "admin-1");

    expect(act).toThrow(NoteNotFoundError);
  });

  it("should report a missing note as not found", () => {
    const missing: Note | undefined = undefined;

    const act = (): Note => resolveOwnedNote(missing, "student-1");

    expect(act).toThrow(NoteNotFoundError);
  });
});
