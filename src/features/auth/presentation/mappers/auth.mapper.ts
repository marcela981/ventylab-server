/*
 * Funcionalidad: Mapper AuthMapper
 * Descripción: Convierte los resultados de autenticación (usuario autenticado y tokens) en DTOs de respuesta
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { toAuthenticatedUser } from "@/features/auth/application/helpers/to-authenticated-user.helper";
import { type AuthenticatedUser } from "@/features/auth/application/results/authenticated-user.result";
import { type LoginResult } from "@/features/auth/application/results/login.result";
import { type RefreshTokenResult } from "@/features/auth/application/results/refresh-token.result";
import { AuthUserDTO } from "@/features/auth/presentation/dtos/auth-user.dto";
import { LoginResponseDTO } from "@/features/auth/presentation/dtos/login-response.dto";
import { MeResponseDTO } from "@/features/auth/presentation/dtos/me-response.dto";
import { RefreshTokenResponseDTO } from "@/features/auth/presentation/dtos/refresh-token-response.dto";
import { type User } from "@/features/users/domain/entities/user.entity";

export class AuthMapper {
  public static toAuthUserDTO(user: AuthenticatedUser): AuthUserDTO {
    return new AuthUserDTO({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      role: user.role,
      image: user.image ?? null,
    });
  }

  public static toLoginResponseDTO(result: LoginResult): LoginResponseDTO {
    return new LoginResponseDTO({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.user.id,
      user: AuthMapper.toAuthUserDTO(result.user),
    });
  }

  public static toRefreshTokenResponseDTO(result: RefreshTokenResult): RefreshTokenResponseDTO {
    return new RefreshTokenResponseDTO({
      accessToken: result.accessToken,
      userId: result.userId,
    });
  }

  public static toMeResponseDTO(user: User, permissions: string[]): MeResponseDTO {
    return new MeResponseDTO({
      user: AuthMapper.toAuthUserDTO(toAuthenticatedUser(user)),
      permissions,
    });
  }
}
