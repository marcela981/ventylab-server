/*
 * Funcionalidad: Repositorio Prisma de notas
 * Descripción: Implementa INotesRepository sobre PrismaService; toda consulta y escritura de notas filtra por user_id, y hace lecturas mínimas de lessons, modules y pages (título, módulo y lessonId de la página) solo para validar el alcance y titular el análisis
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { type Note as NoteModel, type Prisma } from "@prisma/client";

import { Paginated } from "@/common/domain/utils/paginated";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { type Note } from "@/features/notes/domain/entities/note.entity";
import {
  type NoteAnalysisSource,
  type NoteLessonScope,
  type NoteModuleScope,
} from "@/features/notes/domain/read-models/note-scope.read-model";
import { type GetNotesForAnalysisQuery, type GetNotesQuery, type INotesRepository } from "@/features/notes/domain/repositories/notes.repository";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";
import { NotesMapper } from "@/features/notes/infrastructure/persistence/prisma/mappers/notes.mapper";

type NoteWithLessonRow = Prisma.NoteGetPayload<{ include: { lesson: { select: { title: true; module: { select: { title: true } } } } } }>;

@Injectable()
export class NotesPrismaRepository implements INotesRepository {
  public constructor(private readonly _prisma: PrismaService) {}

  public async getById(id: string, ownerId: string, transaction?: unknown): Promise<Note | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: NoteModel | null = await client.note.findFirst({ where: { id, userId: ownerId } });

    return row ? NotesMapper.toDomain(row) : undefined;
  }

  public async getAll(query: GetNotesQuery, transaction?: unknown): Promise<Paginated<Note>> {
    const { page, limit, userId, lessonId, moduleId, ids, createdAtFrom, createdAtTo, sortOrder } = query;

    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const where: Prisma.NoteWhereInput = this._buildScopeWhere(userId, lessonId, moduleId);

    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    if (createdAtFrom || createdAtTo) {
      where.createdAt = { gte: createdAtFrom, lte: createdAtTo };
    }

    const [rows, total] = await Promise.all([
      client.note.findMany({
        where,
        orderBy: { createdAt: sortOrder === "asc" ? "asc" : "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      client.note.count({ where }),
    ]);

    return new Paginated({
      items: rows.map((row: NoteModel) => NotesMapper.toDomain(row)),
      total,
      page,
      limit,
    });
  }

  public async getForAnalysis(query: GetNotesForAnalysisQuery): Promise<NoteAnalysisSource[]> {
    const rows: NoteWithLessonRow[] = await this._prisma.note.findMany({
      where: this._buildScopeWhere(query.userId, query.lessonId, query.moduleId),
      include: { lesson: { select: { title: true, module: { select: { title: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: query.limit,
    });

    return rows.map((row: NoteWithLessonRow) => ({
      noteId: row.id,
      lessonTitle: row.lesson.title,
      moduleTitle: row.lesson.module.title,
      content: NoteContent.reconstitute(row.content),
    }));
  }

  public async save(note: Note, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.NoteUncheckedCreateInput = NotesMapper.toPersistence(note);

    await client.note.upsert({
      where: { id: note.id, userId: note.userId },
      create: data,
      update: data,
    });
  }

  public async delete(id: string, ownerId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const result: Prisma.BatchPayload = await client.note.deleteMany({ where: { id, userId: ownerId } });

    return result.count > 0;
  }

  public async getLessonScope(lessonId: string, transaction?: unknown): Promise<NoteLessonScope | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: { id: string; title: string; moduleId: string; module: { title: string } } | null = await client.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, title: true, moduleId: true, module: { select: { title: true } } },
    });

    return row ? { lessonId: row.id, lessonTitle: row.title, moduleId: row.moduleId, moduleTitle: row.module.title } : undefined;
  }

  public async getModuleScope(moduleId: string, transaction?: unknown): Promise<NoteModuleScope | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: { id: string; title: string } | null = await client.module.findUnique({
      where: { id: moduleId },
      select: { id: true, title: true },
    });

    return row ? { moduleId: row.id, moduleTitle: row.title } : undefined;
  }

  public async isPageInLesson(pageId: string, lessonId: string, transaction?: unknown): Promise<boolean> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const count: number = await client.page.count({ where: { id: pageId, lessonId } });

    return count > 0;
  }

  private _buildScopeWhere(userId: string, lessonId?: string, moduleId?: string): Prisma.NoteWhereInput {
    const where: Prisma.NoteWhereInput = { userId };

    if (lessonId !== undefined) {
      where.lessonId = lessonId;
    }

    if (moduleId !== undefined) {
      where.lesson = { moduleId };
    }

    return where;
  }
}
