/*
 * Funcionalidad: Mapper de persistencia de relaciones profesor-estudiante
 * Descripción: Convierte filas Prisma de TeacherStudent al agregado y el agregado a datos de persistencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type TeacherStudent as TeacherStudentModel } from "@prisma/client";

import { TeacherStudent } from "@/features/teacher-students/domain/entities/teacher-student.entity";

export class TeacherStudentsMapper {
  public static toDomain(row: TeacherStudentModel): TeacherStudent {
    return TeacherStudent.reconstitute({
      id: row.id,
      teacherId: row.teacherId,
      studentId: row.studentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      auditLogs: [],
    });
  }

  public static toPersistence(relationship: TeacherStudent): Prisma.TeacherStudentUncheckedCreateInput {
    return {
      id: relationship.id,
      teacherId: relationship.teacherId,
      studentId: relationship.studentId,
      createdAt: relationship.createdAt,
      updatedAt: relationship.updatedAt,
    };
  }
}
