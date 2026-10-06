/*
 * Funcionalidad: Caso de uso GetAssignedStudentProgressUseCase
 * Descripción: Devuelve el progreso detallado por módulo de un estudiante (lecciones activas completadas, tiempo y último acceso) a partir de los registros de la feature de progreso; un profesor solo accede a estudiantes asignados, administradores y superusuarios a cualquiera
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type LessonCompletionSnapshot,
  type ModuleProgressSnapshot,
} from "@/features/progress/domain/read-models/progress-records.read-model";
import { type IProgressRepository, PROGRESS_REPOSITORY_TOKEN } from "@/features/progress/domain/repositories/progress.repository";
import { GetAssignedStudentProgressCommand } from "@/features/teacher-students/application/commands/get-assigned-student-progress.command";
import { type TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";
import {
  type ModuleLessonCatalogItem,
  type StudentDetailedProgress,
} from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { buildStudentDetailedProgress } from "@/features/teacher-students/domain/services/student-progress-summary";
import { managesAllRelationships } from "@/features/teacher-students/domain/services/teacher-roles";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { StudentAccessDeniedError, UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";

/**
 * @throws {StudentAccessDeniedError} If the requester is a teacher and the student is not assigned to them
 * @throws {UserNotFoundError} If the student does not exist
 * @throws {UserNotStudentError} If the user does not have the STUDENT role
 */
@Injectable()
export class GetAssignedStudentProgressUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
    @Inject(PROGRESS_REPOSITORY_TOKEN)
    private readonly _progressRepository: IProgressRepository,
  ) {}

  public async execute(command: GetAssignedStudentProgressCommand): Promise<StudentDetailedProgress> {
    if (!managesAllRelationships(command.requesterRole)) {
      const relationship: TeacherStudent | undefined = await this._teacherStudentsRepository.getByPair(command.teacherId, command.studentId);

      if (!relationship) {
        throw new StudentAccessDeniedError();
      }
    }

    const student: User | undefined = await this._usersRepository.getById(command.studentId);

    if (!student) {
      throw new UserNotFoundError();
    }

    if (!student.role.isStudent()) {
      throw new UserNotStudentError();
    }

    const [moduleProgresses, completions]: [ModuleProgressSnapshot[], LessonCompletionSnapshot[]] = await Promise.all([
      this._progressRepository.getModuleProgresses(student.id),
      this._progressRepository.getLessonCompletions(student.id),
    ]);

    const moduleIds: string[] = moduleProgresses.map((progress: ModuleProgressSnapshot) => progress.moduleId);
    const catalog: ModuleLessonCatalogItem[] = await this._teacherStudentsRepository.getModuleLessonCatalog(moduleIds);

    return buildStudentDetailedProgress({
      student: { id: student.id, name: student.name, email: student.email },
      moduleIds,
      catalog,
      records: completions.map((completion: LessonCompletionSnapshot) => ({
        lessonId: completion.lessonId,
        isCompleted: completion.isCompleted,
        timeSpent: completion.timeSpent,
        lastAccessed: completion.lastAccessed,
      })),
    });
  }
}
