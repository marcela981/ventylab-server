/*
 * Funcionalidad: Módulo GroupsModule
 * Descripción: Registra la feature de grupos (controlador /api/groups, casos de uso, servicio de acceso, fachada y repositorios Prisma de grupos, miembros y supervisiones); exporta GroupsFacade y, para las features que aún los consumen, los repositorios de grupos y miembros
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AuthModule } from "@/features/auth/auth.module";
import { GroupAccessService } from "@/features/groups/application/services/group-access.service";
import { GroupsFacade } from "@/features/groups/application/services/groups.facade";
import { AddGroupMemberUseCase } from "@/features/groups/application/use-cases/add-group-member.usecase";
import { AddGroupSupervisionUseCase } from "@/features/groups/application/use-cases/add-group-supervision.usecase";
import { CreateGroupUseCase } from "@/features/groups/application/use-cases/create-group.usecase";
import { DeleteGroupUseCase } from "@/features/groups/application/use-cases/delete-group.usecase";
import { GetGroupByIdUseCase } from "@/features/groups/application/use-cases/get-group-by-id.usecase";
import { GetGroupMembersUseCase } from "@/features/groups/application/use-cases/get-group-members.usecase";
import { GetGroupSupervisionsUseCase } from "@/features/groups/application/use-cases/get-group-supervisions.usecase";
import { GetGroupsUseCase } from "@/features/groups/application/use-cases/get-groups.usecase";
import { GetMyGroupsUseCase } from "@/features/groups/application/use-cases/get-my-groups.usecase";
import { RemoveGroupMemberUseCase } from "@/features/groups/application/use-cases/remove-group-member.usecase";
import { RemoveGroupSupervisionUseCase } from "@/features/groups/application/use-cases/remove-group-supervision.usecase";
import { SetSimulatorLeadUseCase } from "@/features/groups/application/use-cases/set-simulator-lead.usecase";
import { UpdateGroupUseCase } from "@/features/groups/application/use-cases/update-group.usecase";
import { GROUP_MEMBERS_REPOSITORY_TOKEN } from "@/features/groups/domain/repositories/group-members.repository";
import { GROUP_SUPERVISIONS_REPOSITORY_TOKEN } from "@/features/groups/domain/repositories/group-supervisions.repository";
import { GROUPS_REPOSITORY_TOKEN } from "@/features/groups/domain/repositories/groups.repository";
import { GroupMembersPrismaRepository } from "@/features/groups/infrastructure/persistence/prisma/repositories/group-members-prisma.repository";
import { GroupSupervisionsPrismaRepository } from "@/features/groups/infrastructure/persistence/prisma/repositories/group-supervisions-prisma.repository";
import { GroupsPrismaRepository } from "@/features/groups/infrastructure/persistence/prisma/repositories/groups-prisma.repository";
import { GroupsController } from "@/features/groups/presentation/controllers/groups.controller";
import { UsersModule } from "@/features/users/users.module";

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [GroupsController],
  providers: [
    {
      provide: GROUPS_REPOSITORY_TOKEN,
      useClass: GroupsPrismaRepository,
    },
    {
      provide: GROUP_MEMBERS_REPOSITORY_TOKEN,
      useClass: GroupMembersPrismaRepository,
    },
    {
      provide: GROUP_SUPERVISIONS_REPOSITORY_TOKEN,
      useClass: GroupSupervisionsPrismaRepository,
    },
    GroupAccessService,
    GroupsFacade,
    GetGroupsUseCase,
    GetMyGroupsUseCase,
    CreateGroupUseCase,
    GetGroupByIdUseCase,
    UpdateGroupUseCase,
    DeleteGroupUseCase,
    GetGroupMembersUseCase,
    AddGroupMemberUseCase,
    RemoveGroupMemberUseCase,
    SetSimulatorLeadUseCase,
    GetGroupSupervisionsUseCase,
    AddGroupSupervisionUseCase,
    RemoveGroupSupervisionUseCase,
  ],
  exports: [GroupsFacade, GROUPS_REPOSITORY_TOKEN, GROUP_MEMBERS_REPOSITORY_TOKEN],
})
export class GroupsModule {}
