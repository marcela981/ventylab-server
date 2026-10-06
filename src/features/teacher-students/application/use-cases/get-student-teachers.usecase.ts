/*
 * Funcionalidad: Caso de uso GetStudentTeachersUseCase
 * Descripción: Lista los profesores asignados a un estudiante existente con rol STUDENT, de la asignación más reciente a la más antigua
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type AssignedTeacherView } from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { type User } from "@/features/users/domain/entities/user.entity";
import { type IUserRepository, USERS_REPOSITORY_TOKEN } from "@/features/users/domain/repositories/users.repository";
import { UserNotFoundError, UserNotStudentError } from "@/features/users/domain/users.errors";

/**
 * @throws {UserNotFoundError} If the student does not exist
 * @throws {UserNotStudentError} If the user does not have the STUDENT role
 */
@Injectable()
export class GetStudentTeachersUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly _usersRepository: IUserRepository,
  ) {}

  public async execute(studentId: string): Promise<AssignedTeacherView[]> {
    const student: User | undefined = await this._usersRepository.getById(studentId);

    if (!student) {
      throw new UserNotFoundError();
    }

    if (!student.role.isStudent()) {
      throw new UserNotStudentError();
    }

    return await this._teacherStudentsRepository.getTeachersOfStudent(studentId);
  }
}
