/*
 * Funcionalidad: DTOs de supervisiones de grupo
 * Descripción: Validación del cuerpo de POST /api/groups/:id/supervisions y formas de respuesta documentadas en Swagger para los vínculos de supervisión y el resultado de eliminar un grupo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

export class AddGroupSupervisionDTO {
  @ApiProperty({ description: "Student group to supervise", example: "cm5group02" })
  @IsString({ message: i18nValidationMessage("groups.validation.student_group_id_required") })
  @IsNotEmpty({ message: i18nValidationMessage("groups.validation.student_group_id_required") })
  public studentGroupId: string;
}

export class SupervisedGroupDTO {
  @ApiProperty({ description: "Student group ID", example: "cm5group02" })
  public id: string;

  @ApiProperty({ description: "Student group name", example: "Grupo A 2026-2" })
  public name: string;

  @ApiProperty({ description: "Whether the student group is active", example: true })
  public isActive: boolean;

  public constructor({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
    this.id = id;
    this.name = name;
    this.isActive = isActive;
  }
}

export class GroupSupervisionDTO {
  @ApiProperty({ description: "Teacher group ID", example: "cm5group01" })
  public teacherGroupId: string;

  @ApiProperty({ description: "Supervised student group", type: SupervisedGroupDTO })
  public studentGroup: SupervisedGroupDTO;

  @ApiProperty({ description: "Link creation date", example: "2026-02-01T10:00:00.000Z" })
  public createdAt: Date;

  public constructor({ teacherGroupId, studentGroup, createdAt }: { teacherGroupId: string; studentGroup: SupervisedGroupDTO; createdAt: Date }) {
    this.teacherGroupId = teacherGroupId;
    this.studentGroup = studentGroup;
    this.createdAt = createdAt;
  }
}

export class DeleteGroupResultDTO {
  @ApiProperty({ description: "What happened: deleted (never had activity) or deactivated (kept for history)", enum: ["deleted", "deactivated"], example: "deactivated" })
  public outcome: string;

  public constructor({ outcome }: { outcome: string }) {
    this.outcome = outcome;
  }
}
