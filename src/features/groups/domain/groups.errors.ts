/*
 * Funcionalidad: Errores de dominio de grupos
 * Descripción: Errores de la feature de grupos (grupo inexistente, jerarquía, cupo, membresía, rol admitido por tipo de grupo, estudiante ya asignado, líder, alcance de gestión y supervisión) con sus claves i18n
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";

export class GroupNotFoundError extends DomainError {
  public constructor() {
    super("Group not found", "groups.group_not_found");
  }
}

export class ParentGroupNotFoundError extends DomainError {
  public constructor() {
    super("The parent group does not exist", "groups.parent_group_not_found");
  }
}

export class ParentGroupInactiveError extends DomainError {
  public constructor() {
    super("The parent group is inactive", "groups.parent_group_inactive");
  }
}

export class GroupMaxDepthExceededError extends DomainError {
  public constructor(maxLevels: number) {
    super(`A maximum of ${maxLevels} hierarchy levels is allowed`, "groups.max_depth_exceeded");
  }
}

export class GroupHasSubgroupsError extends DomainError {
  public constructor() {
    super("Delete the subgroups before deleting this group", "groups.group_has_subgroups");
  }
}

export class GroupFullError extends DomainError {
  public constructor(maxStudents: number) {
    super(`The group already reached its limit of ${maxStudents} students`, "groups.group_full");
  }
}

export class GroupMemberNotFoundError extends DomainError {
  public constructor() {
    super("The user is not a member of this group", "groups.member_not_found");
  }
}

export class SimulatorLeadNotMemberError extends DomainError {
  public constructor() {
    super("The user must be a member of the group to be its leader", "groups.lead_not_member");
  }
}

export class GroupMemberRoleNotAllowedError extends DomainError {
  public constructor() {
    super("The user's role is not allowed in this type of group", "groups.member_role_not_allowed");
  }
}

export class StudentAlreadyInGroupError extends DomainError {
  public constructor() {
    super("The student already belongs to an active student group", "groups.student_already_in_group");
  }
}

export class GroupLeaderNotAllowedError extends DomainError {
  public constructor() {
    super("Only student groups have a leader", "groups.leader_not_allowed");
  }
}

export class GroupManagementForbiddenError extends DomainError {
  public constructor() {
    super("You are not allowed to manage this group", "groups.management_forbidden");
  }
}

export class GroupTypeCreationForbiddenError extends DomainError {
  public constructor() {
    super("You are not allowed to create this type of group", "groups.type_creation_forbidden");
  }
}

export class InvalidGroupSupervisionError extends DomainError {
  public constructor() {
    super("A supervision must link a teacher group to a student group", "groups.invalid_supervision");
  }
}

export class GroupSupervisionNotFoundError extends DomainError {
  public constructor() {
    super("The supervision does not exist", "groups.supervision_not_found");
  }
}

export class GroupUserNotFoundError extends DomainError {
  public constructor() {
    super("The user does not exist", "groups.user_not_found");
  }
}
