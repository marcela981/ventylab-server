/*
 * Funcionalidad: Pruebas de NotesFacade
 * Descripción: Verifica que las últimas notas de un usuario se piden en una sola página ordenada de la más reciente a la más antigua y se exponen con un extracto acotado de su texto plano y con el módulo, la lección y la página tituladas en una sola lectura de etiquetas por lotes
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Paginated } from "@/common/domain/utils/paginated";
import { NOTE_EXCERPT_LENGTH, NotesFacade, type NoteSummary } from "@/features/notes/application/services/notes.facade";
import { Note } from "@/features/notes/domain/entities/note.entity";
import { type NoteContentLabels } from "@/features/notes/domain/read-models/note-scope.read-model";
import { type INotesRepository } from "@/features/notes/domain/repositories/notes.repository";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

const CREATED_AT: Date = new Date("2026-10-10T10:00:00.000Z");

const LABELS: NoteContentLabels = {
  lessons: [{ lessonId: "lesson-1", lessonTitle: "PEEP basics", moduleId: "module-1" }],
  pages: [{ pageId: "page-1", pageTitle: "Alveolar recruitment" }],
};

function buildNote(id: string, text: string, pageId?: string): Note {
  return Note.reconstitute({
    id,
    userId: "student-1",
    lessonId: "lesson-1",
    pageId,
    content: NoteContent.reconstitute({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }),
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  });
}

describe("NotesFacade", () => {
  it("returns the latest notes of a user with a bounded plain-text excerpt and their content labels", async () => {
    const text: string = "PEEP ".repeat(100).trim();
    const notes: Note[] = [buildNote("note-1", text), buildNote("note-2", "Recruitment", "page-1")];
    const getAll: jest.Mock = jest.fn().mockResolvedValue(new Paginated<Note>({ items: notes, total: 2, page: 1, limit: 5 }));
    const getContentLabels: jest.Mock = jest.fn().mockResolvedValue(LABELS);
    const facade: NotesFacade = new NotesFacade({ getAll, getContentLabels } as unknown as INotesRepository);

    const summaries: NoteSummary[] = await facade.getLatestNotes("student-1", 5);

    expect(getAll).toHaveBeenCalledWith({ userId: "student-1", page: 1, limit: 5, sortOrder: "desc" });
    expect(getContentLabels).toHaveBeenCalledTimes(1);
    expect(getContentLabels).toHaveBeenCalledWith(["lesson-1", "lesson-1"], ["page-1"]);
    expect(summaries).toEqual([
      {
        id: "note-1",
        lessonId: "lesson-1",
        pageId: undefined,
        moduleId: "module-1",
        lessonTitle: "PEEP basics",
        pageTitle: undefined,
        excerpt: text.slice(0, NOTE_EXCERPT_LENGTH),
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
      {
        id: "note-2",
        lessonId: "lesson-1",
        pageId: "page-1",
        moduleId: "module-1",
        lessonTitle: "PEEP basics",
        pageTitle: "Alveolar recruitment",
        excerpt: "Recruitment",
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
    ]);
  });

  it("skips the label read when the user has no notes", async () => {
    const getAll: jest.Mock = jest.fn().mockResolvedValue(new Paginated<Note>({ items: [], total: 0, page: 1, limit: 5 }));
    const getContentLabels: jest.Mock = jest.fn();
    const facade: NotesFacade = new NotesFacade({ getAll, getContentLabels } as unknown as INotesRepository);

    const summaries: NoteSummary[] = await facade.getLatestNotes("student-1", 5);

    expect(summaries).toEqual([]);
    expect(getContentLabels).not.toHaveBeenCalled();
  });
});
