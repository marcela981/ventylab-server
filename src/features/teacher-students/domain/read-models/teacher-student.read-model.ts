/*
 * Funcionalidad: Modelos de lectura de relaciones profesor-estudiante
 * Descripción: Vistas de relaciones con sus personas, estudiantes asignados (con resumen de avance opcional), profesores asignados, catálogo de módulos con lecciones activas y progreso detallado de un estudiante por módulo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";

export interface TeacherStudentPersonView {
  readonly id: string;
  readonly name?: string;
  readonly email: string;
}

export interface TeacherStudentView {
  readonly relationship: TeacherStudent;
  readonly teacher: TeacherStudentPersonView;
  readonly student: TeacherStudentPersonView;
}

export interface LessonActivitySummary {
  readonly completedLessons: number;
  readonly totalTimeSpent: number;
  readonly lastAccess?: Date;
}

export interface AssignedStudentView extends TeacherStudentPersonView {
  readonly assignedAt: Date;
  readonly progress?: LessonActivitySummary;
}

export interface AssignedTeacherView extends TeacherStudentPersonView {
  readonly assignedAt: Date;
}

export interface LessonActivityRecord {
  readonly lessonId: string;
  readonly isCompleted: boolean;
  readonly timeSpent: number;
  readonly lastAccessed?: Date;
}

export interface ModuleLessonCatalogItem {
  readonly id: string;
  readonly title: string;
  readonly activeLessonIds: string[];
}

export interface StudentModuleProgress {
  readonly moduleId: string;
  readonly moduleTitle: string;
  readonly completionPercentage: number;
  readonly completedLessons: number;
  readonly totalLessons: number;
  readonly totalTimeSpent: number;
  readonly lastAccess?: Date;
}

export interface StudentDetailedProgress {
  readonly student: TeacherStudentPersonView;
  readonly modules: StudentModuleProgress[];
  readonly overall: {
    readonly totalCompletedLessons: number;
    readonly totalTimeSpent: number;
    readonly lastAccess?: Date;
  };
}
