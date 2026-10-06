/*
 * Funcionalidad: Dobles de prueba de grupos
 * Descripción: Constructores de grupos, membresías y cuentas de usuario y repositorios en memoria (grupos, miembros, supervisiones), fachada de usuarios, gestor de transacciones y bus de eventos simulados para las pruebas unitarias de la feature de grupos; queda fuera del build por terminar en spec.ts
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type IEventBus } from "@/common/application/events/event-bus.interface";
import { type ITransactionManager } from "@/common/application/persistence/transaction-manager.interface";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { GroupMember } from "@/features/groups/domain/entities/group-member.entity";
import { Group } from "@/features/groups/domain/entities/group.entity";
import { type IGroupMembersRepository } from "@/features/groups/domain/repositories/group-members.repository";
import { type IGroupSupervisionsRepository } from "@/features/groups/domain/repositories/group-supervisions.repository";
import { type IGroupsRepository } from "@/features/groups/domain/repositories/groups.repository";
import { type GroupMemberRoleValue } from "@/features/groups/domain/value-objects/group-member-role";
import { type GroupMembershipRoleValue } from "@/features/groups/domain/value-objects/group-membership-role";
import { type GroupTypeValue } from "@/features/groups/domain/value-objects/group-type";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";
import { type UserRoleValue } from "@/features/users/domain/value-objects/user-role";

export const TRANSACTION: string = "tx";

const NOW: Date = new Date("2026-01-01T00:00:00.000Z");

export function buildGroup({
  id = "group-1",
  type = "STUDENT",
  createdBy = "teacher-1",
  simulatorLeaderId,
  maxStudents,
  isActive = true,
}: {
  id?: string;
  type?: GroupTypeValue;
  createdBy?: string;
  simulatorLeaderId?: string;
  maxStudents?: number;
  isActive?: boolean;
} = {}): Group {
  return Group.reconstitute({
    id,
    name: `Group ${id}`,
    type,
    depth: 0,
    simulatorLeaderId,
    isActive,
    maxStudents,
    createdBy,
    createdAt: NOW,
    updatedAt: NOW,
    auditLogs: [],
  });
}

export function buildMember({
  groupId = "group-1",
  userId,
  memberRole = "MEMBER",
  role = "STUDENT",
}: {
  groupId?: string;
  userId: string;
  memberRole?: GroupMembershipRoleValue;
  role?: GroupMemberRoleValue;
}): GroupMember {
  return GroupMember.reconstitute({ id: `${groupId}-${userId}`, groupId, userId, role, memberRole, joinedAt: NOW, auditLogs: [] });
}

export function buildAccount(id: string, role: UserRoleValue): UserAccount {
  return { id, email: `${id}@ventylab.com`, name: id, role, isActive: true, hasPassword: true, createdAt: NOW };
}

export interface GroupsState {
  groups?: Group[];
  members?: GroupMember[];
  users?: UserAccount[];
  supervisions?: { teacherGroupId: string; studentGroupId: string }[];
  supervisedByTeacher?: { teacherUserId: string; studentGroupId: string }[];
  otherActiveStudentMemberships?: number;
  studentsInOtherActiveGroups?: string[];
  hasActivityHistory?: boolean;
  subgroups?: number;
}

export interface GroupsDoubles {
  groupsRepository: IGroupsRepository;
  membersRepository: IGroupMembersRepository;
  supervisionsRepository: IGroupSupervisionsRepository;
  usersFacade: UsersFacade;
  transactionManager: ITransactionManager;
  eventBus: IEventBus;
  access: GroupAccessService;
  saveGroup: jest.Mock;
  deleteGroup: jest.Mock;
  saveMember: jest.Mock;
  deleteMember: jest.Mock;
  acquireLock: jest.Mock;
  addSupervision: jest.Mock;
  removeSupervision: jest.Mock;
  publish: jest.Mock;
}

export function buildDoubles(state: GroupsState = {}): GroupsDoubles {
  const groups: Group[] = state.groups ?? [];
  const members: GroupMember[] = state.members ?? [];
  const users: UserAccount[] = state.users ?? [];
  const supervisions: { teacherGroupId: string; studentGroupId: string }[] = state.supervisions ?? [];
  const supervisedByTeacher: { teacherUserId: string; studentGroupId: string }[] = state.supervisedByTeacher ?? [];

  const saveGroup: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const deleteGroup: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const saveMember: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const deleteMember: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const acquireLock: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const addSupervision: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const removeSupervision: jest.Mock = jest.fn().mockResolvedValue(undefined);
  const publish: jest.Mock = jest.fn();

  const findGroup = (id: string): Group | undefined => groups.find((group: Group) => group.id === id);
  const findMember = (groupId: string, userId: string): GroupMember | undefined =>
    members.find((member: GroupMember) => member.groupId === groupId && member.userId === userId);

  const groupsRepository: IGroupsRepository = {
    getById: jest.fn().mockImplementation((id: string): Promise<Group | undefined> => Promise.resolve(findGroup(id))),
    countSubgroups: jest.fn().mockResolvedValue(state.subgroups ?? 0),
    existsByEnrollmentCode: jest.fn().mockResolvedValue(false),
    hasActivityHistory: jest.fn().mockResolvedValue(state.hasActivityHistory ?? false),
    isSupervisedByTeacherMember: jest.fn().mockImplementation(
      (studentGroupId: string, teacherUserId: string): Promise<boolean> =>
        Promise.resolve(
          supervisedByTeacher.some(
            (link: { teacherUserId: string; studentGroupId: string }) =>
              link.studentGroupId === studentGroupId && link.teacherUserId === teacherUserId,
          ),
        ),
    ),
    getSupervisedStudentGroupIds: jest.fn().mockImplementation(
      (teacherUserId: string): Promise<string[]> =>
        Promise.resolve(
          supervisedByTeacher
            .filter((link: { teacherUserId: string; studentGroupId: string }) => link.teacherUserId === teacherUserId)
            .map((link: { teacherUserId: string; studentGroupId: string }) => link.studentGroupId),
        ),
    ),
    getDetailView: jest.fn().mockImplementation((id: string) => {
      const group: Group | undefined = findGroup(id);

      return Promise.resolve(group ? { group, subGroups: [], membersCount: 0, subGroupsCount: 0, members: [] } : undefined);
    }),
    getStudentGroupSummaryOfUser: jest.fn().mockResolvedValue(undefined),
    getMembershipSummariesOfUser: jest.fn().mockResolvedValue([]),
    save: saveGroup,
    delete: deleteGroup,
  } as unknown as IGroupsRepository;

  const membersRepository: IGroupMembersRepository = {
    getByGroupAndUser: jest.fn().mockImplementation(
      (groupId: string, userId: string): Promise<GroupMember | undefined> => Promise.resolve(findMember(groupId, userId)),
    ),
    getLeaders: jest.fn().mockImplementation(
      (groupId: string): Promise<GroupMember[]> =>
        Promise.resolve(members.filter((member: GroupMember) => member.groupId === groupId && member.isLeader())),
    ),
    countByRole: jest.fn().mockImplementation(
      (groupId: string, role: string): Promise<number> =>
        Promise.resolve(members.filter((member: GroupMember) => member.groupId === groupId && member.role === role).length),
    ),
    getStudentMemberUserIds: jest.fn().mockImplementation(
      (groupId: string): Promise<string[]> =>
        Promise.resolve(
          members
            .filter((member: GroupMember) => member.groupId === groupId && member.role === "STUDENT")
            .map((member: GroupMember) => member.userId),
        ),
    ),
    countOtherActiveStudentGroupMemberships: jest.fn().mockImplementation(
      (userId: string): Promise<number> =>
        Promise.resolve(
          (state.studentsInOtherActiveGroups ?? []).includes(userId) ? 1 : (state.otherActiveStudentMemberships ?? 0),
        ),
    ),
    acquireTransactionLock: acquireLock,
    getViews: jest.fn().mockImplementation((groupId: string) =>
      Promise.resolve(
        members
          .filter((member: GroupMember) => member.groupId === groupId)
          .map((member: GroupMember) => ({ member, user: { id: member.userId, email: `${member.userId}@ventylab.com`, role: member.role } })),
      ),
    ),
    save: saveMember,
    delete: deleteMember,
  };

  const supervisionsRepository: IGroupSupervisionsRepository = {
    exists: jest.fn().mockImplementation(
      (teacherGroupId: string, studentGroupId: string): Promise<boolean> =>
        Promise.resolve(
          supervisions.some(
            (link: { teacherGroupId: string; studentGroupId: string }) =>
              link.teacherGroupId === teacherGroupId && link.studentGroupId === studentGroupId,
          ),
        ),
    ),
    add: addSupervision,
    remove: removeSupervision,
    getViews: jest.fn().mockResolvedValue([]),
  };

  const usersFacade: UsersFacade = {
    getUserById: jest.fn().mockImplementation(
      (id: string): Promise<UserAccount | undefined> => Promise.resolve(users.find((user: UserAccount) => user.id === id)),
    ),
  } as unknown as UsersFacade;

  const transactionManager: ITransactionManager = {
    run: async <T>(work: (transaction: unknown) => Promise<T>): Promise<T> => await work(TRANSACTION),
  };

  return {
    groupsRepository,
    membersRepository,
    supervisionsRepository,
    usersFacade,
    transactionManager,
    eventBus: { publish },
    access: new GroupAccessService(groupsRepository, membersRepository),
    saveGroup,
    deleteGroup,
    saveMember,
    deleteMember,
    acquireLock,
    addSupervision,
    removeSupervision,
    publish,
  };
}
