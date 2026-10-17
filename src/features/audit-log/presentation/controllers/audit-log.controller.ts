/*
 * Funcionalidad: Controlador AuditLogController
 * Descripción: Expone las rutas de solo lectura api/audit para administradores (audit:read): búsqueda paginada con filtros, historial de un objetivo, exportación CSV con tope de filas, detalle de una entrada y catálogo de acciones, tipos de objetivo y tope de exportación; no hay rutas de edición ni borrado
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, Param, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { type Response } from "express";
import { I18n, I18nContext } from "nestjs-i18n";

import { type Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { AUDIT_LOG_EXPORT_ROW_LIMIT, type AuditLogExport, ExportAuditLogsUseCase } from "@/features/audit-log/application/use-cases/export-audit-logs.usecase";
import { type AuditLogCatalog, GetAuditLogCatalogUseCase } from "@/features/audit-log/application/use-cases/get-audit-log-catalog.usecase";
import { GetAuditLogEntryUseCase } from "@/features/audit-log/application/use-cases/get-audit-log-entry.usecase";
import { GetAuditTargetHistoryUseCase } from "@/features/audit-log/application/use-cases/get-audit-target-history.usecase";
import { SearchAuditLogsUseCase } from "@/features/audit-log/application/use-cases/search-audit-logs.usecase";
import { type AuditLogEntryView } from "@/features/audit-log/domain/read-models/audit-log-entry.read-model";
import {
  AuditLogFiltersQueryDTO,
  AuditLogPageQueryDTO,
  AuditTargetParamsDTO,
  SearchAuditLogsQueryDTO,
} from "@/features/audit-log/presentation/dtos/audit-log-request.dto";
import { AuditLogCatalogDTO, AuditLogEntryDTO } from "@/features/audit-log/presentation/dtos/audit-log-response.dto";
import { AuditLogMapper } from "@/features/audit-log/presentation/mappers/audit-log.mapper";
import { toAuditLogCsv } from "@/features/audit-log/presentation/utils/audit-log-csv";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

const TRUNCATED_HEADER: string = "X-Export-Truncated";

@ApiTags("Audit log")
@ApiBearerAuth("JWT-auth")
@Controller("api/audit")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("audit:read")
export class AuditLogController {
  public constructor(
    private readonly _searchAuditLogsUseCase: SearchAuditLogsUseCase,
    private readonly _getAuditTargetHistoryUseCase: GetAuditTargetHistoryUseCase,
    private readonly _exportAuditLogsUseCase: ExportAuditLogsUseCase,
    private readonly _getAuditLogEntryUseCase: GetAuditLogEntryUseCase,
    private readonly _getAuditLogCatalogUseCase: GetAuditLogCatalogUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Search audit log", description: "Paginated audit entries filtered by actor, action, target type, target ID and date range, newest first by default" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Audit log retrieved successfully", type: AuditLogEntryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends" })
  public async searchAuditLogs(@Query() query: SearchAuditLogsQueryDTO, @I18n() i18n: I18nContext): Promise<APIResponse<AuditLogEntryDTO[]>> {
    const entries: Paginated<AuditLogEntryView> = await this._searchAuditLogsUseCase.execute({
      ...AuditLogMapper.toFilters(query),
      ...AuditLogMapper.toPage(query),
    });

    return new APIResponseBuilder<AuditLogEntryDTO[]>()
      .setData(AuditLogMapper.toDTOList(entries.data))
      .setMessage(await i18n.t("audit-log.entries_retrieved"))
      .setPagination(entries.pagination)
      .build();
  }

  @Get("export")
  @ApiProduces("text/csv")
  @ApiOperation({
    summary: "Export audit log as CSV",
    description: `One RFC 4180 row per audit entry matching the filters, oldest first, capped at the export row limit of ${AUDIT_LOG_EXPORT_ROW_LIMIT} rows (also returned as exportRowLimit by GET /api/audit/catalog); cells starting with =, +, -, @ are prefixed against formula injection; the ${TRUNCATED_HEADER} header is "true" when rows were left out`,
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "CSV file" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Range does not start before it ends" })
  public async exportAuditLogs(@Query() query: AuditLogFiltersQueryDTO, @Res() response: Response): Promise<void> {
    const result: AuditLogExport = await this._exportAuditLogsUseCase.execute(AuditLogMapper.toFilters(query));
    const fileName: string = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;

    response.status(HttpStatus.OK);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    response.setHeader(TRUNCATED_HEADER, String(result.truncated));
    response.send(toAuditLogCsv(result.rows));
  }

  @Get("catalog")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get audit log catalog",
    description: "Values to build the audit log filters: every action of the audit action catalog, the target entity types present in the log, and the export row limit",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Audit log catalog retrieved successfully", type: AuditLogCatalogDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getAuditLogCatalog(@I18n() i18n: I18nContext): Promise<APIResponse<AuditLogCatalogDTO>> {
    const catalog: AuditLogCatalog = await this._getAuditLogCatalogUseCase.execute();

    return new APIResponseBuilder<AuditLogCatalogDTO>()
      .setData(AuditLogMapper.toCatalogDTO(catalog))
      .setMessage(await i18n.t("audit-log.catalog_retrieved"))
      .build();
  }

  @Get("targets/:type/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get target audit history", description: "Paginated audit history of one target, matched by entity type or collection, newest first by default" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Target history retrieved successfully", type: AuditLogEntryDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getTargetHistory(
    @Param() params: AuditTargetParamsDTO,
    @Query() query: AuditLogPageQueryDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AuditLogEntryDTO[]>> {
    const entries: Paginated<AuditLogEntryView> = await this._getAuditTargetHistoryUseCase.execute(params.type, params.id, AuditLogMapper.toPage(query));

    return new APIResponseBuilder<AuditLogEntryDTO[]>()
      .setData(AuditLogMapper.toDTOList(entries.data))
      .setMessage(await i18n.t("audit-log.target_history_retrieved"))
      .setPagination(entries.pagination)
      .build();
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get audit entry", description: "One audit entry by its ID" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Audit entry retrieved successfully", type: AuditLogEntryDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Audit entry not found" })
  public async getAuditLogEntry(@Param("id") id: string, @I18n() i18n: I18nContext): Promise<APIResponse<AuditLogEntryDTO>> {
    const entry: AuditLogEntryView = await this._getAuditLogEntryUseCase.execute(id);

    return new APIResponseBuilder<AuditLogEntryDTO>()
      .setData(AuditLogMapper.toDTO(entry))
      .setMessage(await i18n.t("audit-log.entry_retrieved"))
      .build();
  }
}
