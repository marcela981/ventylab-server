/*
 * Funcionalidad: Controlador SectionsController
 * Descripción: Expone las rutas HTTP api/sections (CRUD, estado, reordenamiento por lotes y niveles por sección), aplica guardias y permisos sections:* y responde con APIResponseBuilder; las lecturas son públicas y tratan al lector sin sections:update como estudiante
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "@/features/auth/presentation/guards/optional-jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { canManageContent } from "@/features/curriculum/domain/services/content-visibility";
import { ChangeContentStatusDTO, CreatedContentIdDTO, ReorderItemsDTO } from "@/features/curriculum/presentation/dtos/curriculum-write.dto";
import { CreateSectionCommand } from "@/features/sections/application/commands/create-section.command";
import { UpdateSectionCommand } from "@/features/sections/application/commands/update-section.command";
import { CreateSectionUseCase } from "@/features/sections/application/use-cases/create-section.usecase";
import { DeleteSectionUseCase } from "@/features/sections/application/use-cases/delete-section.usecase";
import { GetSectionByIdUseCase } from "@/features/sections/application/use-cases/get-section-by-id.usecase";
import { GetSectionLevelsUseCase } from "@/features/sections/application/use-cases/get-section-levels.usecase";
import { GetSectionsUseCase } from "@/features/sections/application/use-cases/get-sections.usecase";
import { ReorderSectionsUseCase } from "@/features/sections/application/use-cases/reorder-sections.usecase";
import { UpdateSectionUseCase } from "@/features/sections/application/use-cases/update-section.usecase";
import { type SectionLevelItem, type SectionSummary } from "@/features/sections/domain/read-models/section-views.read-model";
import { CreateSectionDTO, UpdateSectionDTO } from "@/features/sections/presentation/dtos/section-request.dto";
import { SectionDTO, SectionLevelDTO } from "@/features/sections/presentation/dtos/section.dto";
import { SectionsMapper } from "@/features/sections/presentation/mappers/sections.mapper";

const SECTIONS_MANAGE_PERMISSION: string = "sections:update";

@ApiTags("Sections")
@Controller("api/sections")
export class SectionsController {
  public constructor(
    private readonly _getSectionsUseCase: GetSectionsUseCase,
    private readonly _getSectionByIdUseCase: GetSectionByIdUseCase,
    private readonly _getSectionLevelsUseCase: GetSectionLevelsUseCase,
    private readonly _createSectionUseCase: CreateSectionUseCase,
    private readonly _updateSectionUseCase: UpdateSectionUseCase,
    private readonly _reorderSectionsUseCase: ReorderSectionsUseCase,
    private readonly _deleteSectionUseCase: DeleteSectionUseCase,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get sections", description: "Retrieves the sections ordered by position; students only see published sections" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Sections retrieved successfully", type: SectionDTO, isArray: true })
  public async getSections(@CurrentUser() currentUser: JwtPayload | undefined, @I18n() i18n: I18nContext): Promise<APIResponse<SectionDTO[]>> {
    const sections: SectionSummary[] = await this._getSectionsUseCase.execute(canManageContent(currentUser?.permissions, SECTIONS_MANAGE_PERMISSION));

    return new APIResponseBuilder<SectionDTO[]>()
      .setData(sections.map((section: SectionSummary) => SectionsMapper.toDTO(section)))
      .setMessage(await i18n.t("sections.sections_retrieved"))
      .build();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections:create")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create section", description: "Creates a section; it starts as DRAFT unless another status is given" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Section created successfully", type: CreatedContentIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate slug" })
  public async createSection(
    @Body() dto: CreateSectionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<CreatedContentIdDTO>> {
    const id: string = await this._createSectionUseCase.execute(
      new CreateSectionCommand({
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        order: dto.order,
        status: dto.status,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<CreatedContentIdDTO>()
      .setData(new CreatedContentIdDTO({ id }))
      .setMessage(await i18n.t("sections.section_created"))
      .build();
  }

  @Put("reorder")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reorder sections", description: "Sets the order of the given sections in one transaction" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Sections reordered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, duplicates or unknown section IDs" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async reorderSections(@Body() dto: ReorderItemsDTO, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._reorderSectionsUseCase.execute(dto.ids);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("sections.sections_reordered"))
      .build();
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get section by ID", description: "Retrieves a section; unpublished sections answer 404 for students" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section retrieved successfully", type: SectionDTO })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found" })
  public async getSectionById(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SectionDTO>> {
    const section: SectionSummary = await this._getSectionByIdUseCase.execute(id, canManageContent(currentUser?.permissions, SECTIONS_MANAGE_PERMISSION));

    return new APIResponseBuilder<SectionDTO>()
      .setData(SectionsMapper.toDTO(section))
      .setMessage(await i18n.t("sections.section_retrieved"))
      .build();
  }

  @Get(":id/levels")
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get section levels", description: "Retrieves the levels of a section; students only see published levels" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section levels retrieved successfully", type: SectionLevelDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found" })
  public async getSectionLevels(
    @Param("id") id: string,
    @CurrentUser() currentUser: JwtPayload | undefined,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<SectionLevelDTO[]>> {
    const levels: SectionLevelItem[] = await this._getSectionLevelsUseCase.execute(id, canManageContent(currentUser?.permissions, SECTIONS_MANAGE_PERMISSION));

    return new APIResponseBuilder<SectionLevelDTO[]>()
      .setData(levels.map((level: SectionLevelItem) => SectionsMapper.toLevelDTO(level)))
      .setMessage(await i18n.t("sections.section_levels_retrieved"))
      .build();
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update section", description: "Updates a section's slug, title, description or status" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section updated successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Duplicate slug" })
  public async updateSection(
    @Param("id") id: string,
    @Body() dto: UpdateSectionDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateSectionUseCase.execute(
      new UpdateSectionCommand({
        sectionId: id,
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("sections.section_updated"))
      .build();
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections:update")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change section status", description: "Sets the section status to DRAFT, PUBLISHED or ARCHIVED" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section status changed successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found" })
  public async changeSectionStatus(
    @Param("id") id: string,
    @Body() dto: ChangeContentStatusDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._updateSectionUseCase.execute(new UpdateSectionCommand({ sectionId: id, status: dto.status, performedBy: currentUser.sub }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("sections.section_status_changed"))
      .build();
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("sections:delete")
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Delete section",
    description: "Permanently deletes a section with its levels, modules, lessons and pages; answers 409 when any of them has student data",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Section deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Section not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The section has student data; archive it instead" })
  public async deleteSection(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteSectionUseCase.execute(id, currentUser.sub);

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("sections.section_deleted"))
      .build();
  }
}
