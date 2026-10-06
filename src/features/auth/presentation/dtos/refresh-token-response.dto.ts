/*
 * Funcionalidad: DTO RefreshTokenResponseDTO
 * Descripción: Respuesta con los tokens renovados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenResponseDTO {
  @ApiProperty({
    description: "New JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  public accessToken: string;

  @ApiProperty({
    description: "User unique identifier",
    example: "cm5x2k9a00000abcd1234efgh",
  })
  public userId: string;

  public constructor({ accessToken, userId }: { accessToken: string; userId: string }) {
    this.accessToken = accessToken;
    this.userId = userId;
  }
}
