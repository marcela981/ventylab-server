/*
 * Funcionalidad: Repositorio Prisma de relaciones profesor-estudiante
 * Descripción: Implementa ITeacherStudentsRepository sobre la tabla teacher_students; los listados incluyen a profesor y estudiante (y, si se pide, sus registros de lección) en la misma consulta, y el catálogo de módulos lee modules y lessons como lo hacía el progreso detallado original; registra la auditoría del agregado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";
import { type Prisma, type TeacherStudent as TeacherStudentModel } from "@prisma/client";

import { AUDIT_LOG_REPOSITORY_TOKEN, type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type PrismaExecutor, resolveClient } from "@/common/infrastructure/persistence/prisma/prisma-client";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import {
  type TeacherStudent,
  TEACHER_STUDENT_ENTITY_COLLECTION,
  TEACHER_STUDENT_ENTITY_TYPE,
} from "@/features/teacher-students/domain/entities/teacher-student.entity";
import {
  type AssignedStudentView,
  type AssignedTeacherView,
  type ModuleLessonCatalogItem,
  type TeacherStudentPersonView,
  type TeacherStudentView,
} from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import { type ITeacherStudentsRepository } from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { summarizeLessonActivity } from "@/features/teacher-students/domain/services/student-progress-summary";
import { TeacherStudentsMapper } from "@/features/teacher-students/infrastructure/persistence/prisma/mappers/teacher-students.mapper";

interface PersonRow {
  id: string;
  name: string | null;
  email: string;
}

interface LessonActivityRow {
  lessonId: string;
  isCompleted: boolean;
  timeSpent: number;
  lastAccessed: Date | null;
}

type RelationshipViewRow = TeacherStudentModel & { teacher: PersonRow; student: PersonRow };

type StudentRelationshipRow = TeacherStudentModel & { student: PersonRow & { lessonCompletions: LessonActivityRow[] } };

@Injectable()
export class TeacherStudentsPrismaRepository implements ITeacherStudentsRepository {
  public constructor(
    private readonly _prisma: PrismaService,
    @Inject(AUDIT_LOG_REPOSITORY_TOKEN)
    private readonly _auditLogRepository: IAuditLogRepository,
  ) {}

  public async getById(id: string, transaction?: unknown): Promise<TeacherStudent | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: TeacherStudentModel | null = await client.teacherStudent.findUnique({ where: { id } });

    return row ? TeacherStudentsMapper.toDomain(row) : undefined;
  }

  public async getByPair(teacherId: string, studentId: string, transaction?: unknown): Promise<TeacherStudent | undefined> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    const row: TeacherStudentModel | null = await client.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
    });

    return row ? TeacherStudentsMapper.toDomain(row) : undefined;
  }

  public async getAllViews(): Promise<TeacherStudentView[]> {
    const rows: RelationshipViewRow[] = await this._prisma.teacherStudent.findMany({
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row: RelationshipViewRow) => ({
      relationship: TeacherStudentsMapper.toDomain(row),
      teacher: this._toPerson(row.teacher),
      student: this._toPerson(row.student),
    }));
  }

  public async getStudentsOfTeacher(teacherId: string, includeProgress: boolean): Promise<AssignedStudentView[]> {
    const rows: StudentRelationshipRow[] = await this._prisma.teacherStudent.findMany({
      where: { teacherId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            lessonCompletions: {
              take: includeProgress ? undefined : 0,
              select: { lessonId: true, isCompleted: true, timeSpent: true, lastAccessed: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row: StudentRelationshipRow) => ({
      ...this._toPerson(row.student),
      assignedAt: row.createdAt,
      progress: includeProgress
        ? summarizeLessonActivity(
          row.student.lessonCompletions.map((completion: LessonActivityRow) => ({
            lessonId: completion.lessonId,
            isCompleted: completion.isCompleted,
            timeSpent: completion.timeSpent,
            lastAccessed: completion.lastAccessed ?? undefined,
          })),
        )
        : undefined,
    }));
  }

  public async getTeachersOfStudent(studentId: string): Promise<AssignedTeacherView[]> {
    const rows: (TeacherStudentModel & { teacher: PersonRow })[] = await this._prisma.teacherStudent.findMany({
      where: { studentId },
      include: { teacher: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row: TeacherStudentModel & { teacher: PersonRow }) => ({ ...this._toPerson(row.teacher), assignedAt: row.createdAt }));
  }

  public async getModuleLessonCatalog(moduleIds: string[]): Promise<ModuleLessonCatalogItem[]> {
    if (moduleIds.length === 0) {
      return [];
    }

    const rows: { id: string; title: string; lessons: { id: string }[] }[] = await this._prisma.module.findMany({
      where: { id: { in: moduleIds } },
      select: { id: true, title: true, lessons: { where: { isActive: true }, select: { id: true } } },
    });

    return rows.map((row: { id: string; title: string; lessons: { id: string }[] }) => ({
      id: row.id,
      title: row.title,
      activeLessonIds: row.lessons.map((lesson: { id: string }) => lesson.id),
    }));
  }

  public async save(relationship: TeacherStudent, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);
    const data: Prisma.TeacherStudentUncheckedCreateInput = TeacherStudentsMapper.toPersistence(relationship);

    await client.teacherStudent.upsert({
      where: { id: relationship.id },
      create: data,
      update: data,
    });

    await this._saveAuditLogs(relationship, transaction);
  }

  public async delete(relationship: TeacherStudent, transaction?: unknown): Promise<void> {
    const client: PrismaExecutor = resolveClient(this._prisma, transaction);

    await client.teacherStudent.delete({ where: { id: relationship.id } });

    await this._saveAuditLogs(relationship, transaction);
  }

  private async _saveAuditLogs(relationship: TeacherStudent, transaction?: unknown): Promise<void> {
    if (relationship.auditLogs.length > 0) {
      await this._auditLogRepository.save(
        TEACHER_STUDENT_ENTITY_COLLECTION,
        TEACHER_STUDENT_ENTITY_TYPE,
        relationship.id,
        relationship.auditLogs,
        transaction,
      );
    }
  }

  private _toPerson(row: PersonRow): TeacherStudentPersonView {
    return { id: row.id, name: row.name ?? undefined, email: row.email };
  }
}
