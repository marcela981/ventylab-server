/*
 * Funcionalidad: Controlador de grupos
 * Descripción: Endpoints /api/groups: listar (con alcance por rol), grupos propios (/mine), crear con tipo, consultar, actualizar, eliminar o desactivar grupos, gestionar miembros, asignar el líder del grupo STUDENT y gestionar supervisiones TEACHER→STUDENT (solo ADMIN); el alcance de gestión se aplica en los casos de uso
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { AddGroupMemberCommand } from "@/features/groups/application/commands/add-group-member.command";
import { AddGroupSupervisionCommand } from "@/features/groups/application/commands/add-group-supervision.command";
import { CreateGroupCommand } from "@/features/groups/application/commands/create-group.command";
import { DeleteGroupCommand } from "@/features/groups/application/commands/delete-group.command";
import { RemoveGroupMemberCommand } from "@/features/groups/application/commands/remove-group-member.command";
import { RemoveGroupSupervisionCommand } from "@/features/groups/application/commands/remove-group-supervision.command";
import { SetSimulatorLeadCommand } from "@/features/groups/application/commands/set-simulator-lead.command";
import { UpdateGroupCommand } from "@/features/groups/application/commands/update-group.command";
import { AddGroupMemberUseCase } from "@/features/groups/application/use-cases/add-group-member.usecase";
import { AddGroupSupervisionUseCase } from "@/features/groups/application/use-cases/add-group-supervision.usecase";
import { CreateGroupUseCase } from "@/features/groups/application/use-cases/create-group.usecase";
import { type DeleteGroupOutcome, DeleteGroupUseCase } from "@/features/groups/application/use-cases/delete-group.usecase";
import { GetGroupByIdUseCase } from "@/features/groups/application/use-cases/get-group-by-id.usecase";
import { GetGroupMembersUseCase } from "@/features/groups/application/use-cases/get-group-members.usecase";
import { GetGroupSupervisionsUseCase } from "@/features/groups/application/use-cases/get-group-supervisions.usecase";
import { GetGroupsUseCase } from "@/features/groups/application/use-cases/get-groups.usecase";
import { GetMyGroupsUseCase, type MyGroupsResult } from "@/features/groups/application/use-cases/get-my-groups.usecase";
import { RemoveGroupMemberUseCase } from "@/features/groups/application/use-cases/remove-group-member.usecase";
import { RemoveGroupSupervisionUseCase } from "@/features/groups/application/use-cases/remove-group-supervision.usecase";
import { SetSimulatorLeadUseCase } from "@/features/groups/application/use-cases/set-simulator-lead.usecase";
import { UpdateGroupUseCase } from "@/features/groups/application/use-cases/update-group.usecase";
import {
  type GetGroupsFilter,
  type GroupDetailView,
  type GroupMemberView,
  type GroupSupervisionView,
  type GroupView,
} from "@/features/groups/domain/read-models/group.read-model";
import { toGroupType } from "@/features/groups/domain/value-objects/group-type";
import {
  AddGroupMemberDTO,
  CreateGroupDTO,
  GetGroupsQueryDTO,
  SetSimulatorLeadDTO,
  UpdateGroupDTO,
} from "@/features/groups/presentation/dtos/group-request.dto";
import { AddGroupSupervisionDTO, DeleteGroupResultDTO, GroupSupervisionDTO } from "@/features/groups/presentation/dtos/group-supervision.dto";
import { GroupDetailDTO, GroupDTO, GroupIdDTO, GroupMemberDTO } from "@/features/groups/presentation/dtos/group.dto";
import { MyGroupsDTO } from "@/features/groups/presentation/dtos/my-groups.dto";
import { GroupsMapper } from "@/features/groups/presentation/mappers/groups.mapper";
import { type CurrentCaller, toGroupActor } from "@/features/groups/presentation/types/current-caller";

@ApiTags("Groups")
@ApiBearerAuth("JWT-auth")
@Controller("api/groups")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GroupsController {
  public constructor(
    private readonly _getGroupsUseCase: GetGroupsUseCase,
    private readonly _getMyGroupsUseCase: GetMyGroupsUseCase,
    private readonly _createGroupUseCase: CreateGroupUseCase,
    private readonly _getGroupByIdUseCase: GetGroupByIdUseCase,
    private readonly _updateGroupUseCase: UpdateGroupUseCase,
    private readonly _deleteGroupUseCase: DeleteGroupUseCase,
    private readonly _getGroupMembersUseCase: GetGroupMembersUseCase,
    private readonly _addGroupMemberUseCase: AddGroupMemberUseCase,
    private readonly _removeGroupMemberUseCase: RemoveGroupMemberUseCase,
    private readonly _setSimulatorLeadUseCase: SetSimulatorLeadUseCase,
    private readonly _getGroupSupervisionsUseCase: GetGroupSupervisionsUseCase,
    private readonly _addGroupSupervisionUseCase: AddGroupSupervisionUseCase,
    private readonly _removeGroupSupervisionUseCase: RemoveGroupSupervisionUseCase,
  ) {}

  @Get()
  @RequirePermissions("groups:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get groups",
    description:
      "Lists groups ordered by depth and name. Admins see every group; teachers see the student groups they created or supervise and the teacher groups they belong to; myGroups=true applies that teacher scope to admins too",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Groups retrieved successfully", type: GroupDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getGroups(
    @Query() query: GetGroupsQueryDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GroupDTO[]>> {
    const filter: GetGroupsFilter = {
      teacherId: query.teacherId,
      studentId: query.studentId,
      depth: query.depth,
      type: query.type === undefined ? undefined : toGroupType(query.type),
      isActive: query.isActive === undefined ? undefined : query.isActive === "true",
      parentGroupId: query.parentGroupId === "null" ? null : query.parentGroupId || undefined,
      managedByTeacherId: query.myGroups === "true" ? currentUser.sub : undefined,
    };

    const views: GroupView[] = await this._getGroupsUseCase.execute(filter, toGroupActor(currentUser));

    return new APIResponseBuilder<GroupDTO[]>()
      .setData(views.map((view: GroupView) => GroupsMapper.toDTO(view)))
      .setMessage(await i18n.t("groups.groups_retrieved"))
      .build();
  }

  @Get("mine")
  @RequirePermissions("groups:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get my groups",
    description: "For a student: their active student group (name, leader, members and supervising teacher groups) or null. For everyone: their memberships",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Groups retrieved successfully", type: MyGroupsDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMyGroups(@CurrentUser() currentUser: CurrentCaller, @I18n() i18n: I18nContext): Promise<APIResponse<MyGroupsDTO>> {
    const result: MyGroupsResult = await this._getMyGroupsUseCase.execute(toGroupActor(currentUser));

    return new APIResponseBuilder<MyGroupsDTO>()
      .setData(GroupsMapper.toMyGroupsDTO(result))
      .setMessage(await i18n.t("groups.my_groups_retrieved"))
      .build();
  }

  @Post()
  @RequirePermissions("groups:create")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create group",
    description: "Creates a root group or subgroup of the given type (default STUDENT); teachers may only create STUDENT groups. Returns the group ID",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Group created successfully", type: GroupIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, parent group missing or inactive, or maximum depth reached" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, or the caller cannot create this type of group" })
  public async createGroup(
    @Body() dto: CreateGroupDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GroupIdDTO>> {
    const id: string = await this._createGroupUseCase.execute(
      new CreateGroupCommand({
        name: dto.name,
        type: toGroupType(dto.type),
        description: dto.description,
        parentGroupId: dto.parentGroupId,
        semester: dto.semester,
        academicYear: dto.academicYear,
        maxStudents: dto.maxStudents,
        performedBy: currentUser.sub,
        performedByRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<GroupIdDTO>()
      .setData(new GroupIdDTO({ id }))
      .setMessage(await i18n.t("groups.group_created"))
      .build();
  }

  @Get(":id")
  @RequirePermissions("groups:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get group by ID",
    description: "Group detail with its relations and members; groups outside the caller's read scope answer 404",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Group retrieved successfully", type: GroupDetailDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found or outside the caller's scope" })
  public async getGroupById(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GroupDetailDTO>> {
    const view: GroupDetailView = await this._getGroupByIdUseCase.execute(id, toGroupActor(currentUser));

    return new APIResponseBuilder<GroupDetailDTO>()
      .setData(GroupsMapper.toDetailDTO(view))
      .setMessage(await i18n.t("groups.group_retrieved"))
      .build();
  }

  @Patch(":id")
  @RequirePermissions("groups:update")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update group", description: "Updates name, description, semester, academic year, student limit or active state of a group the caller manages" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Group updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, or the group is outside the caller's management scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Reactivating a student group whose member already belongs to another active student group" })
  public async updateGroup(
    @Param("id") id: string,
    @Body() dto: UpdateGroupDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateGroupUseCase.execute(
      new UpdateGroupCommand({
        groupId: id,
        name: dto.name,
        description: dto.description,
        semester: dto.semester,
        academicYear: dto.academicYear,
        maxStudents: dto.maxStudents,
        isActive: dto.isActive,
        performedBy: currentUser.sub,
        performedByRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("groups.group_updated"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("groups:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete or deactivate group",
    description:
      "Deletes a group without subgroups when it never had activity (current or past members, activity assignments, submissions or ventilator reservations); otherwise deactivates it. The response says which happened",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Group deleted or deactivated", type: DeleteGroupResultDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, or the group is outside the caller's management scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The group still has subgroups" })
  public async deleteGroup(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<DeleteGroupResultDTO>> {
    const outcome: DeleteGroupOutcome = await this._deleteGroupUseCase.execute(
      new DeleteGroupCommand({ groupId: id, performedBy: currentUser.sub, performedByRole: currentUser.role }),
    );

    return new APIResponseBuilder<DeleteGroupResultDTO>()
      .setData(new DeleteGroupResultDTO({ outcome }))
      .setMessage(await i18n.t(outcome === "deleted" ? "groups.group_deleted" : "groups.group_deactivated"))
      .build();
  }

  @Get(":id/members")
  @RequirePermissions("groups:read_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get group members", description: "Members with user data ordered by role and join date; groups outside the caller's read scope answer 404" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Members retrieved successfully", type: GroupMemberDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found or outside the caller's scope" })
  public async getGroupMembers(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<GroupMemberDTO[]>> {
    const views: GroupMemberView[] = await this._getGroupMembersUseCase.execute(id, toGroupActor(currentUser));

    return new APIResponseBuilder<GroupMemberDTO[]>()
      .setData(views.map((view: GroupMemberView) => GroupsMapper.toMemberDTO(view)))
      .setMessage(await i18n.t("groups.members_retrieved"))
      .build();
  }

  @Post(":id/members")
  @RequirePermissions("groups:manage_members")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Add group member",
    description: "Adds a user as MEMBER. STUDENT groups accept only students, TEACHER groups only teachers and admins; a student may belong to one active student group",
  })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Member added successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, or the group is outside the caller's management scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group or user not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The group reached its student limit, or the student already belongs to an active student group" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "The user's role is not allowed in this type of group" })
  public async addGroupMember(
    @Param("id") id: string,
    @Body() dto: AddGroupMemberDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._addGroupMemberUseCase.execute(
      new AddGroupMemberCommand({ groupId: id, userId: dto.userId, performedBy: currentUser.sub, performedByRole: currentUser.role }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("groups.member_added"))
      .build();
  }

  @Delete(":id/members/:userId")
  @RequirePermissions("groups:manage_members")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove group member", description: "Removes a member; clears the group leader when it was that member" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Member removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, or the group is outside the caller's management scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found or the user is not a member of the group" })
  public async removeGroupMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeGroupMemberUseCase.execute(
      new RemoveGroupMemberCommand({ groupId: id, userId, performedBy: currentUser.sub, performedByRole: currentUser.role }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("groups.member_removed"))
      .build();
  }

  @Patch(":id/lead")
  @RequirePermissions("groups:update")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Assign group leader",
    description: "Sets a member as the LEADER of a student group (the previous leader becomes MEMBER) and syncs the simulator leader; null or empty userId clears it",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Group leader updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "The user is not a member of the group" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden, or the group is outside the caller's management scope" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Only student groups have a leader" })
  public async setSimulatorLead(
    @Param("id") id: string,
    @Body() dto: SetSimulatorLeadDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._setSimulatorLeadUseCase.execute(
      new SetSimulatorLeadCommand({
        groupId: id,
        userId: dto.userId || undefined,
        performedBy: currentUser.sub,
        performedByRole: currentUser.role,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("groups.lead_updated"))
      .build();
  }

  @Get(":id/supervisions")
  @RequirePermissions("groups:manage_supervisions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get group supervisions", description: "Student groups supervised by this teacher group" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Supervisions retrieved successfully", type: GroupSupervisionDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  public async getGroupSupervisions(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<GroupSupervisionDTO[]>> {
    const views: GroupSupervisionView[] = await this._getGroupSupervisionsUseCase.execute(id);

    return new APIResponseBuilder<GroupSupervisionDTO[]>()
      .setData(views.map((view: GroupSupervisionView) => GroupsMapper.toSupervisionDTO(view)))
      .setMessage(await i18n.t("groups.supervisions_retrieved"))
      .build();
  }

  @Post(":id/supervisions")
  @RequirePermissions("groups:manage_supervisions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add group supervision", description: "Makes this teacher group a supervisor of a student group; adding an existing link is a no-op" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Supervision added successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group not found" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "The link is not from a teacher group to a student group" })
  public async addGroupSupervision(
    @Param("id") id: string,
    @Body() dto: AddGroupSupervisionDTO,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._addGroupSupervisionUseCase.execute(
      new AddGroupSupervisionCommand({ teacherGroupId: id, studentGroupId: dto.studentGroupId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("groups.supervision_added"))
      .build();
  }

  @Delete(":id/supervisions/:studentGroupId")
  @RequirePermissions("groups:manage_supervisions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove group supervision", description: "Removes the supervision link between this teacher group and a student group" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Supervision removed successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Group or supervision not found" })
  public async removeGroupSupervision(
    @Param("id") id: string,
    @Param("studentGroupId") studentGroupId: string,
    @CurrentUser() currentUser: CurrentCaller,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._removeGroupSupervisionUseCase.execute(
      new RemoveGroupSupervisionCommand({ teacherGroupId: id, studentGroupId, performedBy: currentUser.sub }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("groups.supervision_removed"))
      .build();
  }
}
