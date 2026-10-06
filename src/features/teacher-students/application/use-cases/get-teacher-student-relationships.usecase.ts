/*
 * Funcionalidad: Caso de uso GetTeacherStudentRelationshipsUseCase
 * Descripción: Lista todas las relaciones profesor-estudiante con los datos de ambos, de la más reciente a la más antigua
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type TeacherStudentView } from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import {
  type ITeacherStudentsRepository,
  TEACHER_STUDENTS_REPOSITORY_TOKEN,
} from "@/features/teacher-students/domain/repositories/teacher-students.repository";

@Injectable()
export class GetTeacherStudentRelationshipsUseCase {
  public constructor(
    @Inject(TEACHER_STUDENTS_REPOSITORY_TOKEN)
    private readonly _teacherStudentsRepository: ITeacherStudentsRepository,
  ) {}

  public async execute(): Promise<TeacherStudentView[]> {
    return await this._teacherStudentsRepository.getAllViews();
  }
}
