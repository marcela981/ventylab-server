/*
 * Funcionalidad: Cálculo del avance de estudiantes asignados
 * Descripción: Funciones puras que resumen lecciones completadas, tiempo total y último acceso de un conjunto de registros de lección, y arman el progreso detallado por módulo de un estudiante con porcentaje redondeado sobre las lecciones activas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type LessonActivityRecord,
  type LessonActivitySummary,
  type ModuleLessonCatalogItem,
  type StudentDetailedProgress,
  type StudentModuleProgress,
  type TeacherStudentPersonView,
} from "@/features/teacher-students/domain/read-models/teacher-student.read-model";

export function summarizeLessonActivity(records: LessonActivityRecord[]): LessonActivitySummary {
  let lastAccess: Date | undefined;

  for (const record of records) {
    if (record.lastAccessed && (!lastAccess || record.lastAccessed > lastAccess)) {
      lastAccess = record.lastAccessed;
    }
  }

  return {
    completedLessons: records.filter((record: LessonActivityRecord) => record.isCompleted).length,
    totalTimeSpent: records.reduce((total: number, record: LessonActivityRecord) => total + record.timeSpent, 0),
    lastAccess,
  };
}

export function buildStudentDetailedProgress({
  student,
  moduleIds,
  catalog,
  records,
}: {
  student: TeacherStudentPersonView;
  moduleIds: string[];
  catalog: ModuleLessonCatalogItem[];
  records: LessonActivityRecord[];
}): StudentDetailedProgress {
  const catalogById: Map<string, ModuleLessonCatalogItem> = new Map(
    catalog.map((item: ModuleLessonCatalogItem): [string, ModuleLessonCatalogItem] => [item.id, item]),
  );

  const modules: StudentModuleProgress[] = [];

  for (const moduleId of moduleIds) {
    const item: ModuleLessonCatalogItem | undefined = catalogById.get(moduleId);

    if (!item) {
      continue;
    }

    const lessonIds: Set<string> = new Set(item.activeLessonIds);
    const summary: LessonActivitySummary = summarizeLessonActivity(
      records.filter((record: LessonActivityRecord) => lessonIds.has(record.lessonId)),
    );
    const totalLessons: number = item.activeLessonIds.length;

    modules.push({
      moduleId: item.id,
      moduleTitle: item.title,
      completionPercentage: totalLessons > 0 ? Math.round((summary.completedLessons / totalLessons) * 100) : 0,
      completedLessons: summary.completedLessons,
      totalLessons,
      totalTimeSpent: summary.totalTimeSpent,
      lastAccess: summary.lastAccess,
    });
  }

  const overall: LessonActivitySummary = summarizeLessonActivity(records);

  return {
    student,
    modules,
    overall: {
      totalCompletedLessons: overall.completedLessons,
      totalTimeSpent: overall.totalTimeSpent,
      lastAccess: overall.lastAccess,
    },
  };
}
