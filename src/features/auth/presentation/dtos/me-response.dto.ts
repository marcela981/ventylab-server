/*
 * Funcionalidad: DTO MeResponseDTO
 * Descripción: Respuesta con los datos del usuario autenticado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import { AuthUserDTO } from "@/features/auth/presentation/dtos/auth-user.dto";

export class MeResponseDTO {
  @ApiProperty({ description: "Authenticated user summary", type: AuthUserDTO })
  public user: AuthUserDTO;

  @ApiProperty({
    description: "Permissions embedded in the current access token",
    type: [String],
    example: ["levels:read", "progress:read_own"],
  })
  public permissions: string[];

  public constructor({ user, permissions }: { user: AuthUserDTO; permissions: string[] }) {
    this.user = user;
    this.permissions = permissions;
  }
}
