/*
 * Funcionalidad: Controlador AuthController
 * Descripción: Expone las rutas api/auth de registro, inicio de sesión (local y con Google), refresco, cierre de sesión, perfil y puente de NextAuth, con límites de peticiones estrictos en las rutas que emiten tokens
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse as ApiResponseDoc, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { I18n, I18nContext } from "nestjs-i18n";

import { APIResponseBuilder } from "@/common/presentation/builders/api-response.builder";
import { APIResponse } from "@/common/presentation/dtos/api-response.dto";
import { GoogleLoginCommand } from "@/features/auth/application/commands/google-login.command";
import { IssueNextAuthTokenCommand } from "@/features/auth/application/commands/issue-nextauth-token.command";
import { LoginCommand } from "@/features/auth/application/commands/login.command";
import { RefreshTokenCommand } from "@/features/auth/application/commands/refresh-token.command";
import { RegisterCommand } from "@/features/auth/application/commands/register.command";
import { type JwtPayload } from "@/features/auth/application/ports/token-generator.interface";
import { LoginResult } from "@/features/auth/application/results/login.result";
import { RefreshTokenResult } from "@/features/auth/application/results/refresh-token.result";
import { GoogleLoginUseCase } from "@/features/auth/application/use-cases/google-login.usecase";
import { IssueNextAuthTokenUseCase } from "@/features/auth/application/use-cases/issue-nextauth-token.usecase";
import { LoginUseCase } from "@/features/auth/application/use-cases/login.usecase";
import { RefreshTokenUseCase } from "@/features/auth/application/use-cases/refresh-token.usecase";
import { RegisterUseCase } from "@/features/auth/application/use-cases/register.usecase";
import { CurrentUser } from "@/features/auth/presentation/decorators/current-user.decorator";
import { GoogleLoginDTO } from "@/features/auth/presentation/dtos/google-login.dto";
import { LoginResponseDTO } from "@/features/auth/presentation/dtos/login-response.dto";
import { LoginDTO } from "@/features/auth/presentation/dtos/login.dto";
import { MeResponseDTO } from "@/features/auth/presentation/dtos/me-response.dto";
import { NextAuthTokenDTO } from "@/features/auth/presentation/dtos/nextauth-token.dto";
import { RefreshTokenRequestDTO } from "@/features/auth/presentation/dtos/refresh-token-request.dto";
import { RefreshTokenResponseDTO } from "@/features/auth/presentation/dtos/refresh-token-response.dto";
import { RegisterDTO } from "@/features/auth/presentation/dtos/register.dto";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { NEXTAUTH_BRIDGE_SECRET_HEADER, NextAuthBridgeGuard } from "@/features/auth/presentation/guards/nextauth-bridge.guard";
import { AuthMapper } from "@/features/auth/presentation/mappers/auth.mapper";
import { GetUserByIdUseCase } from "@/features/users/application/use-cases/get-user-by-id.usecase";
import { User } from "@/features/users/domain/entities/user.entity";

const SIGN_IN_RATE_LIMIT: number = 5;
const REFRESH_RATE_LIMIT: number = 20;
// The NextAuth bridge is called server-to-server, so every user shares the frontend server IP; its limit is per server, not per person.
const BRIDGE_RATE_LIMIT: number = 60;
const AUTH_RATE_WINDOW_MS: number = 60000;

@ApiTags("Authentication")
@Controller("api/auth")
export class AuthController {
  public constructor(
    private readonly _loginUseCase: LoginUseCase,
    private readonly _registerUseCase: RegisterUseCase,
    private readonly _refreshTokenUseCase: RefreshTokenUseCase,
    private readonly _issueNextAuthTokenUseCase: IssueNextAuthTokenUseCase,
    private readonly _googleLoginUseCase: GoogleLoginUseCase,
    private readonly _getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Student self-registration", description: "Registers a new user with the student role" })
  @ApiResponseDoc({ status: HttpStatus.CREATED, description: "User registered successfully" })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.CONFLICT, description: "Email already exists" })
  public async register(@Body() dto: RegisterDTO, @I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    await this._registerUseCase.execute(
      new RegisterCommand({
        name: dto.name,
        email: dto.email,
        password: dto.password,
      }),
    );

    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("auth.user_registered"))
      .build();
  }

  @Post("login")
  @Throttle({ default: { limit: SIGN_IN_RATE_LIMIT, ttl: AUTH_RATE_WINDOW_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User login",
    description:
      "Authenticates a user with email and password and returns an access token, a refresh token and a user summary. Limited to 5 requests per minute.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Login successful", type: LoginResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error, or the account has no password because it signs in with Google" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Invalid credentials" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "User account is inactive" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many login attempts" })
  public async login(@Body() dto: LoginDTO, @I18n() i18n: I18nContext): Promise<APIResponse<LoginResponseDTO>> {
    const result: LoginResult = await this._loginUseCase.execute(
      new LoginCommand({
        email: dto.email,
        password: dto.password,
      }),
    );

    return new APIResponseBuilder<LoginResponseDTO>()
      .setData(AuthMapper.toLoginResponseDTO(result))
      .setMessage(await i18n.t("auth.login_success"))
      .build();
  }

  @Post("google")
  @Throttle({ default: { limit: SIGN_IN_RATE_LIMIT, ttl: AUTH_RATE_WINDOW_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Google sign-in",
    description:
      "Verifies a Google ID token against GOOGLE_CLIENT_ID, requires a verified email (and an allowed domain when ALLOWED_EMAIL_DOMAINS is set), creates the account as STUDENT or links the existing account with the same email, and returns the same response as login. Limited to 5 requests per minute.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Login successful", type: LoginResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Invalid Google ID token or unverified Google email" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "Email domain not allowed or user account inactive" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many login attempts" })
  @ApiResponseDoc({ status: HttpStatus.SERVICE_UNAVAILABLE, description: "Google sign-in is not configured" })
  public async google(@Body() dto: GoogleLoginDTO, @I18n() i18n: I18nContext): Promise<APIResponse<LoginResponseDTO>> {
    const result: LoginResult = await this._googleLoginUseCase.execute(new GoogleLoginCommand({ idToken: dto.idToken }));

    return new APIResponseBuilder<LoginResponseDTO>()
      .setData(AuthMapper.toLoginResponseDTO(result))
      .setMessage(await i18n.t("auth.login_success"))
      .build();
  }

  @Post("refresh")
  @Throttle({ default: { limit: REFRESH_RATE_LIMIT, ttl: AUTH_RATE_WINDOW_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Issues a new access token using a valid refresh token. Refresh tokens issued at or before the user's last revocation (for example, a role change) are rejected. Limited to 20 requests per minute.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Token refreshed successfully", type: RefreshTokenResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Invalid, expired or revoked refresh token" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "User account is inactive" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many refresh requests" })
  public async refresh(
    @Body() dto: RefreshTokenRequestDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<RefreshTokenResponseDTO>> {
    const result: RefreshTokenResult = await this._refreshTokenUseCase.execute(
      new RefreshTokenCommand({ refreshToken: dto.refreshToken }),
    );

    return new APIResponseBuilder<RefreshTokenResponseDTO>()
      .setData(AuthMapper.toRefreshTokenResponseDTO(result))
      .setMessage(await i18n.t("auth.token_refreshed"))
      .build();
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "User logout",
    description: "Acknowledges the logout. Tokens are stateless, so the client must discard its access and refresh tokens.",
  })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Logout successful" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  public async logout(@I18n() i18n: I18nContext): Promise<APIResponse<null>> {
    return new APIResponseBuilder<null>()
      .setMessage(await i18n.t("auth.logout_success"))
      .build();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get session user", description: "Returns the authenticated user summary and the permissions embedded in the token" })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Session user retrieved successfully", type: MeResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  public async me(@CurrentUser() currentUser: JwtPayload, @I18n() i18n: I18nContext): Promise<APIResponse<MeResponseDTO>> {
    const user: User = await this._getUserByIdUseCase.execute(currentUser.sub);

    return new APIResponseBuilder<MeResponseDTO>()
      .setData(AuthMapper.toMeResponseDTO(user, currentUser.permissions))
      .setMessage(await i18n.t("auth.session_retrieved"))
      .build();
  }

  @Post("nextauth-token")
  @UseGuards(NextAuthBridgeGuard)
  @Throttle({ default: { limit: BRIDGE_RATE_LIMIT, ttl: AUTH_RATE_WINDOW_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Exchange a NextAuth session for backend tokens",
    description: "Issues the same token pair as login for a NextAuth session. Requires the shared bridge secret header. Limited to 60 requests per minute per calling server.",
  })
  @ApiHeader({ name: NEXTAUTH_BRIDGE_SECRET_HEADER, description: "Shared NextAuth bridge secret", required: true })
  @ApiResponseDoc({ status: HttpStatus.OK, description: "Tokens issued successfully", type: LoginResponseDTO })
  @ApiResponseDoc({ status: HttpStatus.BAD_REQUEST, description: "Validation error" })
  @ApiResponseDoc({ status: HttpStatus.UNAUTHORIZED, description: "Missing or invalid bridge secret, or email mismatch" })
  @ApiResponseDoc({ status: HttpStatus.FORBIDDEN, description: "User account is inactive" })
  @ApiResponseDoc({ status: HttpStatus.NOT_FOUND, description: "User not found" })
  @ApiResponseDoc({ status: HttpStatus.TOO_MANY_REQUESTS, description: "Too many token requests" })
  public async nextAuthToken(
    @Body() dto: NextAuthTokenDTO,
    @I18n() i18n: I18nContext,
  ): Promise<APIResponse<LoginResponseDTO>> {
    const result: LoginResult = await this._issueNextAuthTokenUseCase.execute(
      new IssueNextAuthTokenCommand({
        userId: dto.userId,
        email: dto.email,
      }),
    );

    return new APIResponseBuilder<LoginResponseDTO>()
      .setData(AuthMapper.toLoginResponseDTO(result))
      .setMessage(await i18n.t("auth.login_success"))
      .build();
  }
}
