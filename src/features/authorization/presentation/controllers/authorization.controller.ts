/*
 * Funcionalidad: Controlador AuthorizationController
 * Descripción: Expone las rutas api/authorization de permisos y roles
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { AuthorizationService } from "@/features/authorization/application/authorization.service";
import { RolePermissionsDTO } from "@/features/authorization/presentation/dtos/role-permissions.dto";
import { AuthorizationMapper } from "@/features/authorization/presentation/mappers/authorization.mapper";

@ApiTags("Authorization")
@ApiBearerAuth("JWT-auth")
@Controller("api/authorization")
@UseGuards(JwtAuthGuard)
export class AuthorizationController {
  public constructor(private readonly _authorizationService: AuthorizationService) {}

  @Get("permissions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get permission catalog", description: "Retrieves every permission known by the platform" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Permission catalog retrieved successfully", type: String, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getPermissions(@I18n() i18n: I18nContext): Promise<APIResponse<string[]>> {
    return new APIResponseBuilder<string[]>()
      .setData(this._authorizationService.getPermissionCatalog())
      .setMessage(await i18n.t("authorization.permissions_retrieved"))
      .build();
  }

  @Get("roles")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get role permissions", description: "Retrieves the permissions granted to each user role" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Role permissions retrieved successfully", type: RolePermissionsDTO, isArray: true })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async getRoles(@I18n() i18n: I18nContext): Promise<APIResponse<RolePermissionsDTO[]>> {
    return new APIResponseBuilder<RolePermissionsDTO[]>()
      .setData(AuthorizationMapper.toRolePermissionsDTOList(this._authorizationService.getRolePermissions()))
      .setMessage(await i18n.t("authorization.roles_retrieved"))
      .build();
  }
}
