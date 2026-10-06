/*
 * Funcionalidad: Controlador de profesores por estudiante
 * Descripción: Endpoint de administración /api/students/:id/teachers que lista los profesores asignados a un estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GetStudentTeachersUseCase } from "@/features/teacher-students/application/use-cases/get-student-teachers.usecase";
import { type AssignedTeacherView } from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import { AssignedTeacherDTO } from "@/features/teacher-students/presentation/dtos/teacher-student.dto";
import { TeacherStudentsMapper } from "@/features/teacher-students/presentation/mappers/teacher-students.mapper";

@ApiTags("Teacher students")
@ApiBearerAuth("JWT-auth")
@Controller("api/students")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StudentTeachersController {
  public constructor(private readonly _getStudentTeachersUseCase: GetStudentTeachersUseCase) {}

  @Get(":id/teachers")
  @RequirePermissions("teacher-students:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get student teachers", description: "Teachers assigned to a student, newest assignment first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Teachers retrieved successfully", type: AssignedTeacherDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "The user is not a student" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Student not found" })
  public async getStudentTeachers(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<AssignedTeacherDTO[]>> {
    const views: AssignedTeacherView[] = await this._getStudentTeachersUseCase.execute(id);

    return new APIResponseBuilder<AssignedTeacherDTO[]>()
      .setData(views.map((view: AssignedTeacherView) => TeacherStudentsMapper.toAssignedTeacherDTO(view)))
      .setMessage(await i18n.t("teacher-students.teachers_retrieved"))
      .build();
  }
}
