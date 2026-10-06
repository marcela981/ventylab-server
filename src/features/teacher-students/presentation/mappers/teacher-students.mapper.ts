/*
 * Funcionalidad: Mapper de presentación de relaciones profesor-estudiante
 * Descripción: Convierte las vistas de relaciones, estudiantes y profesores asignados y el progreso detallado a los DTOs de respuesta
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AssignedStudentView,
  type AssignedTeacherView,
  type StudentDetailedProgress,
  type StudentModuleProgress,
  type TeacherStudentPersonView,
  type TeacherStudentView,
} from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import {
  AssignedStudentDTO,
  AssignedTeacherDTO,
  LessonActivitySummaryDTO,
  StudentDetailedProgressDTO,
  StudentModuleProgressDTO,
  StudentOverallProgressDTO,
  TeacherStudentDTO,
  TeacherStudentPersonDTO,
} from "@/features/teacher-students/presentation/dtos/teacher-student.dto";

export class TeacherStudentsMapper {
  public static toDTO(view: TeacherStudentView): TeacherStudentDTO {
    return new TeacherStudentDTO({
      id: view.relationship.id,
      teacherId: view.relationship.teacherId,
      studentId: view.relationship.studentId,
      createdAt: view.relationship.createdAt,
      teacher: TeacherStudentsMapper._toPerson(view.teacher),
      student: TeacherStudentsMapper._toPerson(view.student),
    });
  }

  public static toAssignedStudentDTO(view: AssignedStudentView): AssignedStudentDTO {
    return new AssignedStudentDTO({
      id: view.id,
      name: view.name ?? null,
      email: view.email,
      assignedAt: view.assignedAt,
      progress: view.progress
        ? new LessonActivitySummaryDTO({
          completedLessons: view.progress.completedLessons,
          totalTimeSpent: view.progress.totalTimeSpent,
          lastAccess: view.progress.lastAccess ?? null,
        })
        : null,
    });
  }

  public static toAssignedTeacherDTO(view: AssignedTeacherView): AssignedTeacherDTO {
    return new AssignedTeacherDTO({ id: view.id, name: view.name ?? null, email: view.email, assignedAt: view.assignedAt });
  }

  public static toDetailedProgressDTO(progress: StudentDetailedProgress): StudentDetailedProgressDTO {
    return new StudentDetailedProgressDTO({
      student: TeacherStudentsMapper._toPerson(progress.student),
      modules: progress.modules.map(
        (module: StudentModuleProgress) => new StudentModuleProgressDTO({ ...module, lastAccess: module.lastAccess ?? null }),
      ),
      overall: new StudentOverallProgressDTO({
        totalCompletedLessons: progress.overall.totalCompletedLessons,
        totalTimeSpent: progress.overall.totalTimeSpent,
        lastAccess: progress.overall.lastAccess ?? null,
      }),
    });
  }

  private static _toPerson(person: TeacherStudentPersonView): TeacherStudentPersonDTO {
    return new TeacherStudentPersonDTO({ id: person.id, name: person.name ?? null, email: person.email });
  }
}
