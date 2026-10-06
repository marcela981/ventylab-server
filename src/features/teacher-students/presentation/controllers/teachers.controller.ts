/*
 * Funcionalidad: Controlador de estudiantes por profesor
 * Descripción: Endpoints /api/teachers: estudiantes de un profesor (el propio profesor o un administrador), eliminar una relación por par, progreso detallado de un estudiante asignado y verificación de asignación para el profesor autenticado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { AllowSelfOr } from "@/features/auth/presentation/decorators/allow-self-or.decorator";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { SelfOrPermissionGuard } from "@/features/auth/presentation/guards/self-or-permission.guard";
import { GetAssignedStudentProgressCommand } from "@/features/teacher-students/application/commands/get-assigned-student-progress.command";
import { RemoveTeacherStudentByPairCommand } from "@/features/teacher-students/application/commands/remove-teacher-student-by-pair.command";
import { CheckStudentAssignmentUseCase } from "@/features/teacher-students/application/use-cases/check-student-assignment.usecase";
import { GetAssignedStudentProgressUseCase } from "@/features/teacher-students/application/use-cases/get-assigned-student-progress.usecase";
import { GetTeacherStudentsUseCase } from "@/features/teacher-students/application/use-cases/get-teacher-students.usecase";
import { RemoveTeacherStudentByPairUseCase } from "@/features/teacher-students/application/use-cases/remove-teacher-student-by-pair.usecase";
import {
  type AssignedStudentView,
  type StudentDetailedProgress,
} from "@/features/teacher-students/domain/read-models/teacher-student.read-model";
import { GetTeacherStudentsQueryDTO } from "@/features/teacher-students/presentation/dtos/teacher-student-request.dto";
import {
  AssignedStudentDTO,
  StudentAssignmentCheckDTO,
  StudentDetailedProgressDTO,
} from "@/features/teacher-students/presentation/dtos/teacher-student.dto";
import { TeacherStudentsMapper } from "@/features/teacher-students/presentation/mappers/teacher-students.mapper";

@ApiTags("Teacher students")
@ApiBearerAuth("JWT-auth")
@Controller("api/teachers")
@UseGuards(JwtAuthGuard, PermissionsGuard, SelfOrPermissionGuard)
export class TeachersController {
  public constructor(
    private readonly _getTeacherStudentsUseCase: GetTeacherStudentsUseCase,
    private readonly _removeTeacherStudentByPairUseCase: RemoveTeacherStudentByPairUseCase,
    private readonly _getAssignedStudentProgressUseCase: GetAssignedStudentProgressUseCase,
    private readonly _checkStudentAssignmentUseCase: CheckStudentAssignmentUseCase,
  ) {}

  @Get("me/students/:studentId/check")
  @RequirePermissions("teacher-students:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check student assignment", description: "Whether the student is assigned to the authenticated teacher" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Assignment checked successfully", type: StudentAssignmentCheckDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async checkStudentAssignment(
    @Param("studentId") studentId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentAssignmentCheckDTO>> {
    const isAssigned: boolean = await this._checkStudentAssignmentUseCase.execute(currentUser.sub, studentId);

    return new APIResponseBuilder<StudentAssignmentCheckDTO>()
      .setData(new StudentAssignmentCheckDTO({ teacherId: currentUser.sub, studentId, isAssigned }))
      .setMessage(await i18n.t("teacher-students.assignment_checked"))
      .build();
  }

  @Get(":id/students")
  @RequirePermissions("teacher-students:read")
  @AllowSelfOr("id", "teacher-students:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get teacher students",
    description: "Students assigned to a teacher, newest assignment first; teachers only see their own, admins see any teacher",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Students retrieved successfully", type: AssignedStudentDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error or the user is not a teacher" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the teacher themself" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Teacher not found" })
  public async getTeacherStudents(
    @Param("id") id: string,
    @Query() query: GetTeacherStudentsQueryDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AssignedStudentDTO[]>> {
    const views: AssignedStudentView[] = await this._getTeacherStudentsUseCase.execute(id, query.includeProgress === "true");

    return new APIResponseBuilder<AssignedStudentDTO[]>()
      .setData(views.map((view: AssignedStudentView) => TeacherStudentsMapper.toAssignedStudentDTO(view)))
      .setMessage(await i18n.t("teacher-students.students_retrieved"))
      .build();
  }

  @Delete(":teacherId/students/:studentId")
  @RequirePermissions("teacher-students:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove teacher-student relationship by pair", description: "Deletes the relationship between a teacher and a student" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Relationship removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Relationship not found" })
  public async removeRelationshipByPair(
    @Param("teacherId") teacherId: string,
    @Param("studentId") studentId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeTeacherStudentByPairUseCase.execute(
      new RemoveTeacherStudentByPairCommand({ teacherId, studentId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("teacher-students.relationship_removed"))
      .build();
  }

  @Get(":teacherId/students/:studentId/progress")
  @RequirePermissions("teacher-students:read")
  @AllowSelfOr("teacherId", "teacher-students:manage")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get assigned student progress",
    description: "Detailed progress per module of a student; teachers only for their own assigned students, admins for any student",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Student progress retrieved successfully", type: StudentDetailedProgressDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "The user is not a student" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Not the teacher themself, or student not assigned" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Student not found" })
  public async getAssignedStudentProgress(
    @Param("teacherId") teacherId: string,
    @Param("studentId") studentId: string,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<StudentDetailedProgressDTO>> {
    const progress: StudentDetailedProgress = await this._getAssignedStudentProgressUseCase.execute(
      new GetAssignedStudentProgressCommand({ teacherId, studentId, requesterRole: currentUser.role }),
    );

    return new APIResponseBuilder<StudentDetailedProgressDTO>()
      .setData(TeacherStudentsMapper.toDetailedProgressDTO(progress))
      .setMessage(await i18n.t("teacher-students.student_progress_retrieved"))
      .build();
  }
}
