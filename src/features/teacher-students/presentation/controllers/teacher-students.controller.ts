/*
 * Funcionalidad: Controlador de relaciones profesor-estudiante
 * Descripción: Endpoints de administración /api/teacher-students: asignar un estudiante a un profesor, listar todas las relaciones y eliminar una relación por ID
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AssignStudentCommand } from "@/features/teacher-students/application/commands/assign-student.command";
import { RemoveTeacherStudentCommand } from "@/features/teacher-students/application/commands/remove-teacher-student.command";
import { AssignStudentUseCase } from "@/features/teacher-students/application/use-cases/assign-student.usecase";
import { GetTeacherStudentRelationshipsUseCase } from "@/features/teacher-students/application/use-cases/get-teacher-student-relationships.usecase";
import { RemoveTeacherStudentUseCase } from "@/features/teacher-students/application/use-cases/remove-teacher-student.usecase";
import { type TeacherStudentView } from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import { AssignStudentDTO } from "@/features/teacher-students/presentation/dtos/teacher-student-request.dto";
import { TeacherStudentDTO, TeacherStudentIdDTO } from "@/features/teacher-students/presentation/dtos/teacher-student.dto";
import { TeacherStudentsMapper } from "@/features/teacher-students/presentation/mappers/teacher-students.mapper";

@ApiTags("Teacher students")
@ApiBearerAuth("JWT-auth")
@Controller("api/teacher-students")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeacherStudentsController {
  public constructor(
    private readonly _assignStudentUseCase: AssignStudentUseCase,
    private readonly _getTeacherStudentRelationshipsUseCase: GetTeacherStudentRelationshipsUseCase,
    private readonly _removeTeacherStudentUseCase: RemoveTeacherStudentUseCase,
  ) {}

  @Post()
  @RequirePermissions("teacher-students:manage")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Assign student to teacher", description: "Creates a teacher-student relationship; returns its ID" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Student assigned successfully", type: TeacherStudentIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or wrong user roles" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Teacher or student not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The student is already assigned to the teacher" })
  public async assignStudent(
    @Body() dto: AssignStudentDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<TeacherStudentIdDTO>> {
    const id: string = await this._assignStudentUseCase.execute(
      new AssignStudentCommand({ teacherId: dto.teacherId, studentId: dto.studentId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<TeacherStudentIdDTO>()
      .setData(new TeacherStudentIdDTO({ id }))
      .setMessage(await i18n.t("teacher-students.student_assigned"))
      .build();
  }

  @Get()
  @RequirePermissions("teacher-students:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get teacher-student relationships", description: "Every relationship with teacher and student data, newest first" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Relationships retrieved successfully", type: TeacherStudentDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getRelationships(@I18n() i18n: I18nContext): Promise<APIResponse<TeacherStudentDTO[]>> {
    const views: TeacherStudentView[] = await this._getTeacherStudentRelationshipsUseCase.execute();

    return new APIResponseBuilder<TeacherStudentDTO[]>()
      .setData(views.map((view: TeacherStudentView) => TeacherStudentsMapper.toDTO(view)))
      .setMessage(await i18n.t("teacher-students.relationships_retrieved"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("teacher-students:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove teacher-student relationship", description: "Deletes a relationship by its ID" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Relationship removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Relationship not found" })
  public async removeRelationship(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeTeacherStudentUseCase.execute(new RemoveTeacherStudentCommand({ relationshipId: id, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("teacher-students.relationship_removed"))
      .build();
  }
}
