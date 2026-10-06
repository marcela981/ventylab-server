/*
 * Funcionalidad: Caso de uso CheckStudentAssignmentUseCase
 * Descripción: Indica si un estudiante está asignado a un profesor
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";

@Injectable()
export class CheckStudentAssignmentUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
  ) {}

  public async execute(teacherId: string, studentId: string): Promise<boolean> {
    const relationship: TeacherStudent | undefined = await this._teacherStudentsRepository.getByPair(teacherId, studentId);

    return relationship !== undefined;
  }
}
