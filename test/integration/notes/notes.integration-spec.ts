/*
 * Funcionalidad: Prueba de integración de notas
 * Descripción: Con la aplicación Nest real contra el PostgreSQL de Testcontainers verifica el repositorio Prisma de notas a través de CreateNoteUseCase, GetNoteUseCase y DeleteNoteUseCase: la nota se persiste con su lección, solo su autor la lee o la borra (otro usuario recibe NoteNotFoundError y la fila sigue) y una lección inexistente se rechaza sin escribir nada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "node:crypto";

import { type User } from "@prisma/client";

import { CreateNoteCommand } from "@/features/notes/application/commands/create-note.command";
import { DeleteNoteCommand } from "@/features/notes/application/commands/delete-note.command";
import { CreateNoteUseCase } from "@/features/notes/application/use-cases/create-note.usecase";
import { DeleteNoteUseCase } from "@/features/notes/application/use-cases/delete-note.usecase";
import { GetNoteUseCase } from "@/features/notes/application/use-cases/get-note.usecase";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { NoteLessonNotFoundError, NoteNotFoundError } from "@/features/notes/domain/notes.errors";

import { type ContentTree, createContentTree, createStudent } from "../../factories";
import { resetDatabase } from "../../support/database";
import { createIntegrationApp, type IntegrationApp } from "../../support/integration-app";

const NOTE_CONTENT: unknown = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "PEEP protege el reclutamiento alveolar" }] }] };

describe("notes against PostgreSQL", () => {
  let harness: IntegrationApp;
  let owner: User;
  let intruder: User;
  let tree: ContentTree;

  beforeAll(async () => {
    harness = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetDatabase(harness.prisma);
    owner = await createStudent(harness.prisma);
    intruder = await createStudent(harness.prisma);
    tree = await createContentTree(harness.prisma);
  });

  afterAll(async () => {
    await harness?.close();
  });

  function createNote(): Promise<Note> {
    return harness.app.get(CreateNoteUseCase).execute(new CreateNoteCommand({ userId: owner.id, lessonId: tree.lesson.id, pageId: tree.page.id, content: NOTE_CONTENT }));
  }

  it("should persist a note and read it back for its owner", async () => {
    const created: Note = await createNote();

    const read: Note = await harness.app.get(GetNoteUseCase).execute(created.id, owner.id);

    expect(read.id).toBe(created.id);
    expect(await harness.prisma.note.findUnique({ where: { id: created.id }, select: { userId: true, lessonId: true, pageId: true } })).toEqual({
      userId: owner.id,
      lessonId: tree.lesson.id,
      pageId: tree.page.id,
    });
  });

  it("should hide a note from another user and refuse to delete it", async () => {
    const created: Note = await createNote();

    const read: Promise<Note> = harness.app.get(GetNoteUseCase).execute(created.id, intruder.id);
    const deletion: Promise<void> = harness.app.get(DeleteNoteUseCase).execute(new DeleteNoteCommand({ noteId: created.id, userId: intruder.id }));

    await expect(read).rejects.toBeInstanceOf(NoteNotFoundError);
    await expect(deletion).rejects.toBeInstanceOf(NoteNotFoundError);
    expect(await harness.prisma.note.count({ where: { id: created.id } })).toBe(1);
  });

  it("should delete the note of its owner", async () => {
    const created: Note = await createNote();

    await harness.app.get(DeleteNoteUseCase).execute(new DeleteNoteCommand({ noteId: created.id, userId: owner.id }));

    expect(await harness.prisma.note.count({ where: { id: created.id } })).toBe(0);
  });

  it("should reject a note for a missing lesson without writing a row", async () => {
    const creation: Promise<Note> = harness.app.get(CreateNoteUseCase).execute(new CreateNoteCommand({ userId: owner.id, lessonId: randomUUID(), content: NOTE_CONTENT }));

    await expect(creation).rejects.toBeInstanceOf(NoteLessonNotFoundError);
    expect(await harness.prisma.note.count()).toBe(0);
  });
});
