/*
 * Funcionalidad: Controlador de valoraciones de IA
 * Descripción: Endpoints /api/ai-ratings para el destinatario de una salida de IA: PUT crea o edita su valoración (una por objetivo) y GET mine devuelve la propia para precargar el formulario; requieren el permiso ai-ratings:create_own
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { GetMyAiRatingUseCase } from "@/features/ai-ratings/application/use-cases/get-my-ai-rating.usecase";
import { UpsertAiRatingUseCase } from "@/features/ai-ratings/application/use-cases/upsert-ai-rating.usecase";
import { type AiRating } from "@/features/ai-ratings/domain/entities/ai-rating.entity";
import { type AiRatingTargetTypeValue } from "@/features/ai-ratings/domain/read-models/ai-rating.read-model";
import { GetMyAiRatingQueryDTO, UpsertAiRatingDTO } from "@/features/ai-ratings/presentation/dtos/ai-rating-request.dto";
import { AiRatingDTO } from "@/features/ai-ratings/presentation/dtos/ai-rating-response.dto";
import { AiRatingsMapper } from "@/features/ai-ratings/presentation/mappers/ai-ratings.mapper";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { RequirePermissions } from "@/features/auth/presentation/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";

@ApiTags("AI ratings")
@ApiBearerAuth("JWT-auth")
@Controller("api/ai-ratings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiRatingsController {
  public constructor(
    private readonly _upsertAiRatingUseCase: UpsertAiRatingUseCase,
    private readonly _getMyAiRatingUseCase: GetMyAiRatingUseCase,
  ) {}

  @Put()
  @RequirePermissions("ai-ratings:create_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Rate an AI output",
    description:
      "Creates or replaces the caller's rating of one AI output (one rating per user and target). Only the user who received the output can rate it; grade feedback can be rated once the grade is published",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Rating saved" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Missing permission or the caller is not the recipient of the output" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "The output does not exist or is not visible yet" })
  @ApiResponseDoc({ status: HttpStatus.UNPROCESSABLE_ENTITY, description: "Score out of 1–5, comment too long or aiCallId not matching the output" })
  public async upsertAiRating(
    @Body() dto: UpsertAiRatingDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<null>> {
    await this._upsertAiRatingUseCase.execute(AiRatingsMapper.toUpsertCommand(dto, currentUser.sub));

    return new APIResponseBuilder<null>().setMessage(await i18n.t("ai-ratings.rating_saved")).build();
  }

  @Get("mine")
  @RequirePermissions("ai-ratings:create_own")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get my rating of an AI output", description: "The caller's rating of the target, or null data when not rated yet" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Rating retrieved successfully", type: AiRatingDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Forbidden" })
  public async getMyAiRating(
    @Query() query: GetMyAiRatingQueryDTO,
    @CurrentUser() currentUser: JwtPayload,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<AiRatingDTO | null>> {
    const rating: AiRating | undefined = await this._getMyAiRatingUseCase.execute(
      currentUser.sub,
      query.targetType as AiRatingTargetTypeValue,
      query.targetId,
    );

    return new APIResponseBuilder<AiRatingDTO | null>()
      .setData(rating ? AiRatingsMapper.toDTO(rating) : null)
      .setMessage(await i18n.t("ai-ratings.rating_retrieved"))
      .build();
  }
}
