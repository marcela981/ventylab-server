/*
 * Funcionalidad: Caso de uso GetTeacherStudentsUseCase
 * Descripción: Lista los estudiantes asignados a un profesor existente con rol TEACHER o ADMIN, opcionalmente con su resumen de lecciones completadas, tiempo y último acceso
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AssignedStudentView } from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { canActAsTeacher } from "@/features/teacher-students/domain/services/teacher-roles";
import { TeacherRoleRequiredError } from "@/features/teacher-students/domain/teacher-students.errors";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the teacher does not exist
 * @throws {TeacherRoleRequiredError} If the user does not have the TEACHER or ADMIN role
 */
@Injectable()
export class GetTeacherStudentsUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
  ) {}

  public async execute(teacherId: string, includeProgress: boolean): Promise<AssignedStudentView[]> {
    const teacher: User | undefined = await this._usersRepository.getById(teacherId);

    if (!teacher) {
      throw new UserNotFoundError();
    }

    if (!canActAsTeacher(teacher.role.value)) {
      throw new TeacherRoleRequiredError();
    }

    return await this._teacherStudentsRepository.getStudentsOfTeacher(teacherId, includeProgress);
  }
}
