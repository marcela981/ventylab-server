/*
 * Funcionalidad: Mapper de presentación de grupos
 * Descripción: Convierte las vistas de grupos, miembros, grupos propios y supervisiones a los DTOs de respuesta de /api/groups
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type MyGroupsResult } from "@/features/groups/application/use-cases/get-my-groups.usecase";
import {
  type GroupDetailView,
  type GroupMembershipSummaryView,
  type GroupMemberView,
  type GroupNameView,
  type GroupPersonView,
  type GroupSupervisionView,
  type GroupView,
  type StudentGroupMemberSummaryView,
  type StudentGroupSummaryView,
  type SubgroupView,
} from "@/features/groups/domain/read-models/group.read-model";
import { GroupSupervisionDTO, SupervisedGroupDTO } from "@/features/groups/presentation/dtos/group-supervision.dto";
import {
  GroupDetailDTO,
  GroupDTO,
  type GroupDTOFields,
  GroupMemberDTO,
  GroupMemberUserDTO,
  GroupPersonDTO,
  GroupReferenceDTO,
  SubgroupDTO,
} from "@/features/groups/presentation/dtos/group.dto";
import {
  GroupMembershipDTO,
  GroupNameDTO,
  MyGroupsDTO,
  StudentGroupLeaderDTO,
  StudentGroupMemberDTO,
  StudentGroupSummaryDTO,
} from "@/features/groups/presentation/dtos/my-groups.dto";

export class GroupsMapper {
  public static toDTO(view: GroupView): GroupDTO {
    return new GroupDTO(GroupsMapper._toFields(view));
  }

  public static toDetailDTO(view: GroupDetailView): GroupDetailDTO {
    return new GroupDetailDTO({
      ...GroupsMapper._toFields(view),
      members: view.members.map((member: GroupMemberView) => GroupsMapper.toMemberDTO(member)),
    });
  }

  public static toMemberDTO(view: GroupMemberView): GroupMemberDTO {
    return new GroupMemberDTO({
      id: view.member.id,
      groupId: view.member.groupId,
      userId: view.member.userId,
      role: view.member.role,
      memberRole: view.member.memberRole,
      joinedAt: view.member.joinedAt,
      user: new GroupMemberUserDTO({
        id: view.user.id,
        name: view.user.name ?? null,
        email: view.user.email,
        role: view.user.role,
        image: view.user.image ?? null,
        createdAt: view.user.createdAt ?? null,
      }),
    });
  }

  public static toMyGroupsDTO(result: MyGroupsResult): MyGroupsDTO {
    return new MyGroupsDTO({
      studentGroup: result.studentGroup ? GroupsMapper._toStudentGroupDTO(result.studentGroup) : null,
      memberships: result.memberships.map((membership: GroupMembershipSummaryView) => new GroupMembershipDTO(membership)),
    });
  }

  public static toSupervisionDTO(view: GroupSupervisionView): GroupSupervisionDTO {
    return new GroupSupervisionDTO({
      teacherGroupId: view.teacherGroupId,
      studentGroup: new SupervisedGroupDTO(view.studentGroup),
      createdAt: view.createdAt,
    });
  }

  private static _toStudentGroupDTO(view: StudentGroupSummaryView): StudentGroupSummaryDTO {
    return new StudentGroupSummaryDTO({
      id: view.id,
      name: view.name,
      leader: view.leader ? new StudentGroupLeaderDTO({ id: view.leader.id, name: view.leader.name ?? null }) : null,
      members: view.members.map(
        (member: StudentGroupMemberSummaryView) =>
          new StudentGroupMemberDTO({ userId: member.userId, name: member.name ?? null, memberRole: member.memberRole }),
      ),
      supervisingGroups: view.supervisingGroups.map((group: GroupNameView) => new GroupNameDTO(group)),
    });
  }

  private static _toFields(view: GroupView): GroupDTOFields {
    return {
      id: view.group.id,
      name: view.group.name,
      description: view.group.description ?? null,
      type: view.group.type,
      parentGroupId: view.group.parentGroupId ?? null,
      depth: view.group.depth,
      simulatorLeaderId: view.group.simulatorLeaderId ?? null,
      isActive: view.group.isActive,
      maxStudents: view.group.maxStudents ?? null,
      enrollmentCode: view.group.enrollmentCode ?? null,
      semester: view.group.semester ?? null,
      academicYear: view.group.academicYear ?? null,
      createdBy: view.group.createdBy ?? null,
      createdAt: view.group.createdAt,
      updatedAt: view.group.updatedAt,
      leader: GroupsMapper._toPerson(view.leader),
      creator: GroupsMapper._toPerson(view.creator),
      parentGroup: view.parentGroup ? new GroupReferenceDTO(view.parentGroup) : null,
      subGroups: view.subGroups.map((subGroup: SubgroupView) => new SubgroupDTO(subGroup)),
      membersCount: view.membersCount,
      subGroupsCount: view.subGroupsCount,
    };
  }

  private static _toPerson(person?: GroupPersonView): GroupPersonDTO | null {
    return person ? new GroupPersonDTO({ id: person.id, name: person.name ?? null, email: person.email }) : null;
  }
}
