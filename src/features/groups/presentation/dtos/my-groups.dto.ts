/*
 * Funcionalidad: DTOs de respuesta de los grupos propios
 * Descripción: Formas de respuesta documentadas en Swagger para GET /api/groups/mine: grupo STUDENT del estudiante (nombre, líder, miembros con nombre y grupos TEACHER que lo supervisan) y lista de membresías del usuario
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { GROUP_MEMBERSHIP_ROLE_VALUES } from "@/features/groups/domain/value-objects/group-membership-role";
import { GROUP_TYPE_VALUES } from "@/features/groups/domain/value-objects/group-type";

export class GroupNameDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Docentes UCI" })
  public name: string;

  public constructor({ id, name }: { id: string; name: string }) {
    this.id = id;
    this.name = name;
  }
}

export class StudentGroupLeaderDTO {
  @ApiProperty({ description: "Leader user ID", example: "cm5student01" })
  public id: string;

  @ApiProperty({ description: "Leader name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  public constructor({ id, name }: { id: string; name: string | null }) {
    this.id = id;
    this.name = name;
  }
}

export class StudentGroupMemberDTO {
  @ApiProperty({ description: "Member user ID", example: "cm5student02" })
  public userId: string;

  @ApiProperty({ description: "Member name", example: "Luis Gómez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "Role inside the group", enum: GROUP_MEMBERSHIP_ROLE_VALUES, example: "MEMBER" })
  public memberRole: string;

  public constructor({ userId, name, memberRole }: { userId: string; name: string | null; memberRole: string }) {
    this.userId = userId;
    this.name = name;
    this.memberRole = memberRole;
  }
}

export class StudentGroupSummaryDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Grupo A 2026-2" })
  public name: string;

  @ApiProperty({ description: "Group leader", type: StudentGroupLeaderDTO, nullable: true })
  public leader: StudentGroupLeaderDTO | null;

  @ApiProperty({ description: "Group members", type: StudentGroupMemberDTO, isArray: true })
  public members: StudentGroupMemberDTO[];

  @ApiProperty({ description: "Teacher groups that supervise this group", type: GroupNameDTO, isArray: true })
  public supervisingGroups: GroupNameDTO[];

  public constructor({
    id,
    name,
    leader,
    members,
    supervisingGroups,
  }: {
    id: string;
    name: string;
    leader: StudentGroupLeaderDTO | null;
    members: StudentGroupMemberDTO[];
    supervisingGroups: GroupNameDTO[];
  }) {
    this.id = id;
    this.name = name;
    this.leader = leader;
    this.members = members;
    this.supervisingGroups = supervisingGroups;
  }
}

export class GroupMembershipDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public groupId: string;

  @ApiProperty({ description: "Group name", example: "Grupo A 2026-2" })
  public groupName: string;

  @ApiProperty({ description: "Group type", enum: GROUP_TYPE_VALUES, example: "STUDENT" })
  public groupType: string;

  @ApiProperty({ description: "Whether the group is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Role inside the group", enum: GROUP_MEMBERSHIP_ROLE_VALUES, example: "MEMBER" })
  public memberRole: string;

  public constructor({
    groupId,
    groupName,
    groupType,
    isActive,
    memberRole,
  }: {
    groupId: string;
    groupName: string;
    groupType: string;
    isActive: boolean;
    memberRole: string;
  }) {
    this.groupId = groupId;
    this.groupName = groupName;
    this.groupType = groupType;
    this.isActive = isActive;
    this.memberRole = memberRole;
  }
}

export class MyGroupsDTO {
  @ApiProperty({ description: "Active student group of a student; null for teachers, admins or students without a group", type: StudentGroupSummaryDTO, nullable: true })
  public studentGroup: StudentGroupSummaryDTO | null;

  @ApiProperty({ description: "Every group membership of the caller", type: GroupMembershipDTO, isArray: true })
  public memberships: GroupMembershipDTO[];

  public constructor({ studentGroup, memberships }: { studentGroup: StudentGroupSummaryDTO | null; memberships: GroupMembershipDTO[] }) {
    this.studentGroup = studentGroup;
    this.memberships = memberships;
  }
}
