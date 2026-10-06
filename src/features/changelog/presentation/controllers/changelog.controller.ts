/*
 * Funcionalidad: Controlador ChangeLogController
 * Descripción: Expone las rutas HTTP api/changelog de la feature de historial de cambios, aplica guardias y permisos y responde con APIResponseBuilder; depende de GetChangeStatsUseCase, GetChangeLogUseCase, GetEntityHistoryUseCase, GetRecentChangesUseCase
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { ChangeLogRequester } from "@/features/changelog/application/commands/change-log-requester";
import { GetChangeStatsUseCase } from "@/features/changelog/application/use-cases/get-change-stats.usecase";
import { GetChangeLogUseCase } from "@/features/changelog/application/use-cases/get-changelog.usecase";
import { GetEntityHistoryUseCase } from "@/features/changelog/application/use-cases/get-entity-history.usecase";
import { GetRecentChangesUseCase } from "@/features/changelog/application/use-cases/get-recent-changes.usecase";
import { type ChangeLogEntry } from "@/features/changelog/domain/entities/change-log-entry.entity";
import { type ChangeLogActionValue } from "@/features/changelog/domain/value-objects/change-log-action";
import { type ChangeLogEntityTypeValue } from "@/features/changelog/domain/value-objects/change-log-entity-type";
import { type ChangeLogStats } from "@/features/changelog/domain/value-objects/change-log-stats";
import { ChangeLogEntryDTO } from "@/features/changelog/presentation/dtos/change-log-entry.dto";
import { ChangeLogStatsDTO } from "@/features/changelog/presentation/dtos/change-log-stats.dto";
import { EntityHistoryParamsDTO } from "@/features/changelog/presentation/dtos/entity-history-params.dto";
import { GetChangeStatsQueryDTO } from "@/features/changelog/presentation/dtos/get-change-stats-query.dto";
import { GetChangeLogQueryDTO } from "@/features/changelog/presentation/dtos/get-changelog-query.dto";
import { GetRecentChangesQueryDTO } from "@/features/changelog/presentation/dtos/get-recent-changes-query.dto";
import { ChangeLogMapper } from "@/features/changelog/presentation/mappers/changelog.mapper";

@ApiTags("Changelog")
@ApiBearerAuth("JWT-auth")
@Controller("api/changelog")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("changelog:read")
export class ChangeLogController {
  public constructor(
    private readonly _getChangeLogUseCase: GetChangeLogUseCase,
    private readonly _getRecentChangesUseCase: GetRecentChangesUseCase,
    private readonly _getChangeStatsUseCase: GetChangeStatsUseCase,
    private readonly _getEntityHistoryUseCase: GetEntityHistoryUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get change log", description: "Retrieves a paginated, filtered change log. Teachers only see their own changes." })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Change log retrieved successfully", type: ChangeLogEntryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getChangeLog(
    @Query() query: GetChangeLogQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ChangeLogEntryDTO[]>> {
    const entries: Paginated<ChangeLogEntry> = await this._getChangeLogUseCase.execute(
      {
        page: query.page,
        limit: query.limit,
        createdAtFrom: query.createdAtFrom,
        createdAtTo: query.createdAtTo,
        sortOrder: query.sortOrder,
        entityType: query.entityType as ChangeLogEntityTypeValue | undefined,
        entityId: query.entityId,
        action: query.action as ChangeLogActionValue | undefined,
        changedBy: query.changedBy,
      },
      new ChangeLogRequester({ id: currentUser.sub, role: currentUser.role }),
    );

    return new APIResponseBuilder<ChangeLogEntryDTO[]>()
      .setData(ChangeLogMapper.toDTOList(entries.data))
      .setMessage(await i18n.t("changelog.changelog_retrieved"))
      .setPagination(entries.pagination)
      .build();
  }

  @Get("recent")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get recent changes", description: "Retrieves the most recent changes across all entity types" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Recent changes retrieved successfully", type: ChangeLogEntryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getRecentChanges(
    @Query() query: GetRecentChangesQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ChangeLogEntryDTO[]>> {
    const entries: ChangeLogEntry[] = await this._getRecentChangesUseCase.execute(
      query.limit,
      new ChangeLogRequester({ id: currentUser.sub, role: currentUser.role }),
    );

    return new APIResponseBuilder<ChangeLogEntryDTO[]>()
      .setData(ChangeLogMapper.toDTOList(entries))
      .setMessage(await i18n.t("changelog.recent_changes_retrieved"))
      .build();
  }

  @Get("stats")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get change statistics", description: "Counts changes per entity type and action within a period" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Statistics retrieved successfully", type: ChangeLogStatsDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getChangeStats(
    @Query() query: GetChangeStatsQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ChangeLogStatsDTO>> {
    const stats: ChangeLogStats = await this._getChangeStatsUseCase.execute(
      query.fromDate,
      query.toDate,
      new ChangeLogRequester({ id: currentUser.sub, role: currentUser.role }),
    );

    return new APIResponseBuilder<ChangeLogStatsDTO>()
      .setData(ChangeLogMapper.toStatsDTO(stats))
      .setMessage(await i18n.t("changelog.stats_retrieved"))
      .build();
  }

  @Get(":entityType/:entityId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get entity history", description: "Retrieves the full change history of one entity" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Entity history retrieved successfully", type: ChangeLogEntryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getEntityHistory(
    @Param() params: EntityHistoryParamsDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<ChangeLogEntryDTO[]>> {
    const entries: ChangeLogEntry[] = await this._getEntityHistoryUseCase.execute(
      params.entityType as ChangeLogEntityTypeValue,
      params.entityId,
      new ChangeLogRequester({ id: currentUser.sub, role: currentUser.role }),
    );

    return new APIResponseBuilder<ChangeLogEntryDTO[]>()
      .setData(ChangeLogMapper.toDTOList(entries))
      .setMessage(await i18n.t("changelog.entity_history_retrieved"))
      .build();
  }
}
