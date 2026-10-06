/*
 * Funcionalidad: DTO LoginResponseDTO
 * Descripción: Respuesta del inicio de sesión con usuario y tokens
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { AuthUserDTO } from "@/features/auth/presentation/dtos/auth-user.dto";

export class LoginResponseDTO {
  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  public accessToken: string;

  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  public refreshToken: string;

  @ApiProperty({
    description: "User unique identifier",
    example: "cm5x2k9a00000abcd1234efgh",
  })
  public userId: string;

  @ApiProperty({ description: "Authenticated user summary", type: AuthUserDTO })
  public user: AuthUserDTO;

  public constructor({
    accessToken,
    refreshToken,
    userId,
    user,
  }: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    user: AuthUserDTO;
  }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.userId = userId;
    this.user = user;
  }
}
