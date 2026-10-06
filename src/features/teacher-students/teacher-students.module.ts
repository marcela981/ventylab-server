/*
 * Funcionalidad: Módulo TeacherStudentsModule
 * Descripción: Registra la feature de relaciones profesor-estudiante (controladores /api/teacher-students, /api/teachers y /api/students/:id/teachers, casos de uso y repositorio Prisma); importa UsersModule para validar roles y ProgressModule para el progreso detallado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { ProgressModule } from "@/features/progress/progress.module";
import { AssignStudentUseCase } from "@/features/teacher-students/application/use-cases/assign-student.usecase";
import { CheckStudentAssignmentUseCase } from "@/features/teacher-students/application/use-cases/check-student-assignment.usecase";
import { GetAssignedStudentProgressUseCase } from "@/features/teacher-students/application/use-cases/get-assigned-student-progress.usecase";
import { GetStudentTeachersUseCase } from "@/features/teacher-students/application/use-cases/get-student-teachers.usecase";
import { GetTeacherStudentRelationshipsUseCase } from "@/features/teacher-students/application/use-cases/get-teacher-student-relationships.usecase";
import { GetTeacherStudentsUseCase } from "@/features/teacher-students/application/use-cases/get-teacher-students.usecase";
import { RemoveTeacherStudentByPairUseCase } from "@/features/teacher-students/application/use-cases/remove-teacher-student-by-pair.usecase";
import { RemoveTeacherStudentUseCase } from "@/features/teacher-students/application/use-cases/remove-teacher-student.usecase";
import { TEACHER_STUDENTS_REPOSITORY_TOKEN } from "@/features/teacher-students/domain/repositories/teacher-students.repository";
import { TeacherStudentsPrismaRepository } from "@/features/teacher-students/infrastructure/persistence/prisma/repositories/teacher-students-prisma.repository";
import { StudentTeachersController } from "@/features/teacher-students/presentation/controllers/student-teachers.controller";
import { TeacherStudentsController } from "@/features/teacher-students/presentation/controllers/teacher-students.controller";
import { TeachersController } from "@/features/teacher-students/presentation/controllers/teachers.controller";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, UsersModule, ProgressModule],
  controllers: [TeacherStudentsController, TeachersController, StudentTeachersController],
  providers: [
    {
      provide: TEACHER_STUDENTS_REPOSITORY_TOKEN,
      useClass: TeacherStudentsPrismaRepository,
    },
    AssignStudentUseCase,
    GetTeacherStudentRelationshipsUseCase,
    RemoveTeacherStudentUseCase,
    RemoveTeacherStudentByPairUseCase,
    GetTeacherStudentsUseCase,
    GetStudentTeachersUseCase,
    GetAssignedStudentProgressUseCase,
    CheckStudentAssignmentUseCase,
  ],
  exports: [TEACHER_STUDENTS_REPOSITORY_TOKEN, CheckStudentAssignmentUseCase],
})
export class TeacherStudentsModule {}
