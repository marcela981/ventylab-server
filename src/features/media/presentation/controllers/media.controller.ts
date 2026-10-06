/*
 * Funcionalidad: Controlador de media
 * Descripción: Expone la carga multipart de archivos (FileInterceptor en memoria), el listado y la consulta de media para docentes y administradores, la URL firmada con expiración y el borrado con verificación de uso
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { Paginated } from "@/common/domain/utils/paginated";
import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { GetMediaListCommand } from "@/features/media/application/commands/get-media-list.command";
import { MediaAccessCommand } from "@/features/media/application/commands/media-access.command";
import { UploadMediaCommand } from "@/features/media/application/commands/upload-media.command";
import { MediaURLResult } from "@/features/media/application/results/media-url.result";
import { DeleteMediaUseCase } from "@/features/media/application/use-cases/delete-media.usecase";
import { GetMediaByIdUseCase } from "@/features/media/application/use-cases/get-media-by-id.usecase";
import { GetMediaListUseCase } from "@/features/media/application/use-cases/get-media-list.usecase";
import { GetMediaURLUseCase } from "@/features/media/application/use-cases/get-media-url.usecase";
import { UploadMediaUseCase } from "@/features/media/application/use-cases/upload-media.usecase";
import { Media } from "@/features/media/domain/entities/media.entity";
import { MediaFileRequiredError } from "@/features/media/domain/media.errors";
import { type MediaRequester } from "@/features/media/domain/services/media-access";
import { type MediaKindValue } from "@/features/media/domain/value-objects/media-kind";
import { GetMediaListQueryDTO } from "@/features/media/presentation/dtos/get-media-list-query.dto";
import { MediaDTO, MediaIdDTO, MediaURLDTO } from "@/features/media/presentation/dtos/media.dto";
import { type UploadedMediaFile } from "@/features/media/presentation/dtos/uploaded-media-file";
import { MediaMapper } from "@/features/media/presentation/mappers/media.mapper";

@ApiTags("Media")
@ApiBearerAuth("JWT-auth")
@Controller("api/media")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MediaController {
  public constructor(
    private readonly _uploadMediaUseCase: UploadMediaUseCase,
    private readonly _getMediaListUseCase: GetMediaListUseCase,
    private readonly _getMediaByIdUseCase: GetMediaByIdUseCase,
    private readonly _getMediaURLUseCase: GetMediaURLUseCase,
    private readonly _deleteMediaUseCase: DeleteMediaUseCase,
  ) {}

  @Post()
  @RequirePermissions("media:create")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: { file: { type: "string", format: "binary", description: "Image (png, jpeg, webp, gif), PDF, or video (mp4, webm)" } },
    },
  })
  @ApiOperation({ summary: "Upload media", description: "Uploads one file to storage after validating its MIME type and size, and records it" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "Media uploaded successfully", type: MediaIdDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "No file or an empty file was sent" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.PAYLOAD_TOO_LARGE, description: "The file exceeds the size limit of its kind" })
  @ApiResponseDoc({ status: HttpStatus.UNSUPPORTED_MEDIA_TYPE, description: "The MIME type is not allowed" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "File storage is not configured" })
  public async uploadMedia(
    @UploadedFile() file: UploadedMediaFile | undefined,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<MediaIdDTO>> {
    if (!file) {
      throw new MediaFileRequiredError();
    }

    const id: string = await this._uploadMediaUseCase.execute(
      new UploadMediaCommand({
        content: file.buffer,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname,
        performedBy: currentUser.sub,
      }),
    );

    return new APIResponseBuilder<MediaIdDTO>()
      .setData(new MediaIdDTO({ id }))
      .setMessage(await i18n.t("media.media_uploaded"))
      .build();
  }

  @Get()
  @RequirePermissions("media:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get media list", description: "Retrieves a paginated list of media; teachers only see their own uploads" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Media retrieved successfully", type: MediaDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMediaList(
    @Query() query: GetMediaListQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<MediaDTO[]>> {
    const result: Paginated<Media> = await this._getMediaListUseCase.execute(
      new GetMediaListCommand({
        query: {
          page: query.page,
          limit: query.limit,
          ids: query.ids,
          createdAtFrom: query.createdAtFrom,
          createdAtTo: query.createdAtTo,
          sortOrder: query.sortOrder,
          kind: query.kind as MediaKindValue | undefined,
          ownerId: query.ownerId,
          search: query.search,
        },
        requester: this._toRequester(currentUser),
      }),
    );

    return new APIResponseBuilder<MediaDTO[]>()
      .setData(result.data.map((media: Media) => MediaMapper.toDTO(media)))
      .setMessage(await i18n.t("media.media_list_retrieved"))
      .setPagination(result.pagination)
      .build();
  }

  @Get(":id")
  @RequirePermissions("media:read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get media by id", description: "Retrieves one media record; teachers only see their own uploads" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Media retrieved successfully", type: MediaDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Media not found" })
  public async getMediaById(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<MediaDTO>> {
    const media: Media = await this._getMediaByIdUseCase.execute(new MediaAccessCommand({ mediaId: id, requester: this._toRequester(currentUser) }));

    return new APIResponseBuilder<MediaDTO>()
      .setData(MediaMapper.toDTO(media))
      .setMessage(await i18n.t("media.media_retrieved"))
      .build();
  }

  @Get(":id/url")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get signed media URL",
    description:
      "Returns a signed download URL with its expiry; teachers and admins always get it, students only when published content with published ancestors uses the media",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Signed URL generated successfully", type: MediaURLDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Media not found or not visible" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "File storage is not configured" })
  public async getMediaURL(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<MediaURLDTO>> {
    const result: MediaURLResult = await this._getMediaURLUseCase.execute(
      new MediaAccessCommand({ mediaId: id, requester: this._toRequester(currentUser) }),
    );

    return new APIResponseBuilder<MediaURLDTO>()
      .setData(MediaMapper.toURLDTO(result))
      .setMessage(await i18n.t("media.media_url_generated"))
      .build();
  }

  @Delete(":id")
  @RequirePermissions("media:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete media", description: "Deletes the stored file and its record when no page section references it" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Media deleted successfully" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "Media not found" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "The media is referenced by page content" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "File storage is not configured" })
  public async deleteMedia(@Param("id") id: string, @CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._deleteMediaUseCase.execute(new MediaAccessCommand({ mediaId: id, requester: this._toRequester(currentUser) }));

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("media.media_deleted"))
      .build();
  }

  private _toRequester(currentUser: JwtPayload): MediaRequester {
    return { userId: currentUser.sub, role: currentUser.role, permissions: currentUser.permissions ?? [] };
  }
}
