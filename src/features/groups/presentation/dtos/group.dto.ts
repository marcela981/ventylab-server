/*
 * Funcionalidad: DTOs de respuesta de grupos
 * Descripción: Formas de respuesta documentadas en Swagger para grupos (con su tipo), subgrupos, personas relacionadas, miembros (con su rol LEADER o MEMBER) y el ID del grupo creado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { GROUP_MEMBER_ROLE_VALUES } from "@/features/groups/domain/value-objects/group-member-role";
import { GROUP_MEMBERSHIP_ROLE_VALUES } from "@/features/groups/domain/value-objects/group-membership-role";
import { GROUP_TYPE_VALUES } from "@/features/groups/domain/value-objects/group-type";

export class GroupIdDTO {
  @ApiProperty({ description: "Identifier of the created group", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export class GroupPersonDTO {
  @ApiProperty({ description: "User ID", example: "cm5user01" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "ana@example.com" })
  public email: string;

  public constructor({ id, name, email }: { id: string; name: string | null; email: string }) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

export class GroupReferenceDTO {
  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Grupo A" })
  public name: string;

  @ApiProperty({ description: "Hierarchy depth", example: 0 })
  public depth: number;

  public constructor({ id, name, depth }: { id: string; name: string; depth: number }) {
    this.id = id;
    this.name = name;
    this.depth = depth;
  }
}

export class SubgroupDTO {
  @ApiProperty({ description: "Subgroup ID", example: "cm5group02" })
  public id: string;

  @ApiProperty({ description: "Subgroup name", example: "Subgrupo 1" })
  public name: string;

  @ApiProperty({ description: "Hierarchy depth", example: 1 })
  public depth: number;

  @ApiProperty({ description: "Number of members", example: 12 })
  public membersCount: number;

  @ApiProperty({ description: "Number of subgroups", example: 0 })
  public subGroupsCount: number;

  public constructor({
    id,
    name,
    depth,
    membersCount,
    subGroupsCount,
  }: {
    id: string;
    name: string;
    depth: number;
    membersCount: number;
    subGroupsCount: number;
  }) {
    this.id = id;
    this.name = name;
    this.depth = depth;
    this.membersCount = membersCount;
    this.subGroupsCount = subGroupsCount;
  }
}

export class GroupMemberUserDTO {
  @ApiProperty({ description: "User ID", example: "cm5user01" })
  public id: string;

  @ApiProperty({ description: "User name", example: "Ana Pérez", nullable: true, type: String })
  public name: string | null;

  @ApiProperty({ description: "User email", example: "ana@example.com" })
  public email: string;

  @ApiProperty({ description: "Platform role of the user", example: "STUDENT" })
  public role: string;

  @ApiProperty({ description: "Profile image URL", example: null, nullable: true, type: String })
  public image: string | null;

  @ApiProperty({ description: "User creation date (members listing only)", example: "2026-01-15T10:00:00.000Z", nullable: true, type: Date })
  public createdAt: Date | null;

  public constructor({
    id,
    name,
    email,
    role,
    image,
    createdAt,
  }: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
    createdAt: Date | null;
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.role = role;
    this.image = image;
    this.createdAt = createdAt;
  }
}

export class GroupMemberDTO {
  @ApiProperty({ description: "Membership ID", example: "cm5member01" })
  public id: string;

  @ApiProperty({ description: "Group ID", example: "cm5group01" })
  public groupId: string;

  @ApiProperty({ description: "User ID", example: "cm5user01" })
  public userId: string;

  @ApiProperty({ description: "Legacy member role, derived from the user's platform role", enum: GROUP_MEMBER_ROLE_VALUES, example: "STUDENT" })
  public role: string;

  @ApiProperty({ description: "Role inside the group", enum: GROUP_MEMBERSHIP_ROLE_VALUES, example: "MEMBER" })
  public memberRole: string;

  @ApiProperty({ description: "Join date", example: "2026-02-01T10:00:00.000Z" })
  public joinedAt: Date;

  @ApiProperty({ description: "Member user data", type: GroupMemberUserDTO })
  public user: GroupMemberUserDTO;

  public constructor({
    id,
    groupId,
    userId,
    role,
    memberRole,
    joinedAt,
    user,
  }: {
    id: string;
    groupId: string;
    userId: string;
    role: string;
    memberRole: string;
    joinedAt: Date;
    user: GroupMemberUserDTO;
  }) {
    this.id = id;
    this.groupId = groupId;
    this.userId = userId;
    this.role = role;
    this.memberRole = memberRole;
    this.joinedAt = joinedAt;
    this.user = user;
  }
}

export interface GroupDTOFields {
  id: string;
  name: string;
  description: string | null;
  type: string;
  parentGroupId: string | null;
  depth: number;
  simulatorLeaderId: string | null;
  isActive: boolean;
  maxStudents: number | null;
  enrollmentCode: string | null;
  semester: string | null;
  academicYear: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  leader: GroupPersonDTO | null;
  creator: GroupPersonDTO | null;
  parentGroup: GroupReferenceDTO | null;
  subGroups: SubgroupDTO[];
  membersCount: number;
  subGroupsCount: number;
}

export class GroupDTO {
  @ApiProperty({ description: "Group ID", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Group name", example: "Grupo A 2026-2" })
  public name: string;

  @ApiProperty({ description: "Group description", example: "Morning section", nullable: true, type: String })
  public description: string | null;

  @ApiProperty({ description: "Group type", enum: GROUP_TYPE_VALUES, example: "STUDENT" })
  public type: string;

  @ApiProperty({ description: "Parent group ID", example: null, nullable: true, type: String })
  public parentGroupId: string | null;

  @ApiProperty({ description: "Hierarchy depth (0, 1 or 2)", example: 0 })
  public depth: number;

  @ApiProperty({ description: "Simulator leader user ID", example: null, nullable: true, type: String })
  public simulatorLeaderId: string | null;

  @ApiProperty({ description: "Whether the group is active", example: true })
  public isActive: boolean;

  @ApiProperty({ description: "Maximum number of students", example: 30, nullable: true, type: Number })
  public maxStudents: number | null;

  @ApiProperty({ description: "Enrollment code", example: "A1B2C3", nullable: true, type: String })
  public enrollmentCode: string | null;

  @ApiProperty({ description: "Semester", example: "2026-2", nullable: true, type: String })
  public semester: string | null;

  @ApiProperty({ description: "Academic year", example: "2026", nullable: true, type: String })
  public academicYear: string | null;

  @ApiProperty({ description: "Creator user ID", example: "cm5teacher01", nullable: true, type: String })
  public createdBy: string | null;

  @ApiProperty({ description: "Creation date", example: "2026-02-01T10:00:00.000Z" })
  public createdAt: Date;

  @ApiProperty({ description: "Last update date", example: "2026-02-01T10:00:00.000Z" })
  public updatedAt: Date;

  @ApiProperty({ description: "Simulator leader", type: GroupPersonDTO, nullable: true })
  public leader: GroupPersonDTO | null;

  @ApiProperty({ description: "Creator", type: GroupPersonDTO, nullable: true })
  public creator: GroupPersonDTO | null;

  @ApiProperty({ description: "Parent group", type: GroupReferenceDTO, nullable: true })
  public parentGroup: GroupReferenceDTO | null;

  @ApiProperty({ description: "Active subgroups", type: SubgroupDTO, isArray: true })
  public subGroups: SubgroupDTO[];

  @ApiProperty({ description: "Number of members", example: 25 })
  public membersCount: number;

  @ApiProperty({ description: "Number of subgroups (active or not)", example: 2 })
  public subGroupsCount: number;

  public constructor(fields: GroupDTOFields) {
    this.id = fields.id;
    this.name = fields.name;
    this.description = fields.description;
    this.type = fields.type;
    this.parentGroupId = fields.parentGroupId;
    this.depth = fields.depth;
    this.simulatorLeaderId = fields.simulatorLeaderId;
    this.isActive = fields.isActive;
    this.maxStudents = fields.maxStudents;
    this.enrollmentCode = fields.enrollmentCode;
    this.semester = fields.semester;
    this.academicYear = fields.academicYear;
    this.createdBy = fields.createdBy;
    this.createdAt = fields.createdAt;
    this.updatedAt = fields.updatedAt;
    this.leader = fields.leader;
    this.creator = fields.creator;
    this.parentGroup = fields.parentGroup;
    this.subGroups = fields.subGroups;
    this.membersCount = fields.membersCount;
    this.subGroupsCount = fields.subGroupsCount;
  }
}

export class GroupDetailDTO extends GroupDTO {
  @ApiProperty({ description: "Members ordered by role and join date", type: GroupMemberDTO, isArray: true })
  public members: GroupMemberDTO[];

  public constructor(fields: GroupDTOFields & { members: GroupMemberDTO[] }) {
    super(fields);
    this.members = fields.members;
  }
}
