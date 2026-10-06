/*
 * Funcionalidad: Repositorio de relaciones profesor-estudiante
 * Descripción: Contrato de persistencia y lectura del agregado TeacherStudent (búsqueda por ID o par, listados de relaciones, estudiantes de un profesor y profesores de un estudiante) y del catálogo de módulos con lecciones activas que usa el progreso detallado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";
import {
  type AssignedStudentView,
  type AssignedTeacherView,
  type ModuleLessonCatalogItem,
  type TeacherStudentView,
} from "@/features/teacher-students/domain/read-models/teacher-student.read-model";

export const TEACHER_STUDENTS_REPOSITORY_TOKEN: unique symbol = Symbol("TEACHER_STUDENTS_REPOSITORY_TOKEN");

export interface ITeacherStudentsRepository {
  getById(id: string, transaction?: unknown): Promise<TeacherStudent | undefined>;
  getByPair(teacherId: string, studentId: string, transaction?: unknown): Promise<TeacherStudent | undefined>;
  getAllViews(): Promise<TeacherStudentView[]>;
  getStudentsOfTeacher(teacherId: string, includeProgress: boolean): Promise<AssignedStudentView[]>;
  getTeachersOfStudent(studentId: string): Promise<AssignedTeacherView[]>;
  getModuleLessonCatalog(moduleIds: string[]): Promise<ModuleLessonCatalogItem[]>;
  save(relationship: TeacherStudent, transaction?: unknown): Promise<void>;
  delete(relationship: TeacherStudent, transaction?: unknown): Promise<void>;
}
