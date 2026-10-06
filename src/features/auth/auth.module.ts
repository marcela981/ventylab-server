/*
 * Funcionalidad: Módulo AuthModule
 * Descripción: Módulo global de autenticación: JWT, casos de uso de acceso (local, Google y puente de NextAuth), verificador de ID tokens de Google, dominios de correo permitidos, guards y el verificador de tokens que consume la capa común de tiempo real; depende de UsersModule
 * Versión: 1.3
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule, type JwtModuleOptions } from "@nestjs/jwt";

import { ACCESS_TOKEN_VERIFIER_TOKEN } from "@/common/application/ports/access-token-verifier.interface";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { GOOGLE_ID_TOKEN_VERIFIER_TOKEN } from "@/features/auth/application/ports/google-id-token-verifier.interface";
import { TOKEN_GENERATOR_TOKEN } from "@/features/auth/application/ports/token-generator.interface";
import { ALLOWED_EMAIL_DOMAINS_TOKEN, parseAllowedEmailDomains } from "@/features/auth/application/tokens/allowed-email-domains.token";
import { GoogleLoginUseCase } from "@/features/auth/application/use-cases/google-login.usecase";
import { IssueNextAuthTokenUseCase } from "@/features/auth/application/use-cases/issue-nextauth-token.usecase";
import { LoginUseCase } from "@/features/auth/application/use-cases/login.usecase";
import { RefreshTokenUseCase } from "@/features/auth/application/use-cases/refresh-token.usecase";
import { RegisterUseCase } from "@/features/auth/application/use-cases/register.usecase";
import { GoogleIdTokenVerifier } from "@/features/auth/infrastructure/google/google-id-token-verifier";
import { JwtAccessTokenVerifier } from "@/features/auth/infrastructure/jwt/jwt-access-token-verifier";
import { JwtTokenGenerator } from "@/features/auth/infrastructure/jwt/jwt-token-generator";
import { AuthController } from "@/features/auth/presentation/controllers/auth.controller";
import { JwtAuthGuard } from "@/features/auth/presentation/guards/jwt-auth.guard";
import { NextAuthBridgeGuard } from "@/features/auth/presentation/guards/nextauth-bridge.guard";
import { OptionalJwtAuthGuard } from "@/features/auth/presentation/guards/optional-jwt-auth.guard";
import { PermissionsGuard } from "@/features/auth/presentation/guards/permissions.guard";
import { SelfOrPermissionGuard } from "@/features/auth/presentation/guards/self-or-permission.guard";
import { UsersModule } from "@/features/users/users.module";

@Global()
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables, true>): JwtModuleOptions => ({
        secret: configService.get("JWT_SECRET", { infer: true }),
        signOptions: {
          expiresIn: configService.get("JWT_EXPIRES_IN", { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    RefreshTokenUseCase,
    IssueNextAuthTokenUseCase,
    GoogleLoginUseCase,
    {
      provide: GOOGLE_ID_TOKEN_VERIFIER_TOKEN,
      useClass: GoogleIdTokenVerifier,
    },
    {
      provide: ALLOWED_EMAIL_DOMAINS_TOKEN,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>): string[] =>
        parseAllowedEmailDomains(configService.get("ALLOWED_EMAIL_DOMAINS", { infer: true })),
    },
    {
      provide: TOKEN_GENERATOR_TOKEN,
      useClass: JwtTokenGenerator,
    },
    {
      provide: ACCESS_TOKEN_VERIFIER_TOKEN,
      useClass: JwtAccessTokenVerifier,
    },
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    PermissionsGuard,
    SelfOrPermissionGuard,
    NextAuthBridgeGuard,
  ],
  exports: [
    TOKEN_GENERATOR_TOKEN,
    ACCESS_TOKEN_VERIFIER_TOKEN,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    PermissionsGuard,
    SelfOrPermissionGuard,
  ],
})
export class AuthModule {}
