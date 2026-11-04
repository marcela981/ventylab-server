/*
 * Funcionalidad: DTO de la versión desplegada
 * Descripción: Cuerpo sin envoltorio de GET /api/version: commit de la imagen (sha), fecha de construcción (builtAt) y versión del contrato de la API (contract); sha y builtAt valen "unknown" cuando la imagen se construyó sin esos argumentos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class VersionInfoDTO {
  @ApiProperty({ description: "Git commit the running image was built from, or \"unknown\"", example: "3f2c1ab9d0e4c6b7a8f9e0d1c2b3a4f5e6d7c8b9" })
  public sha: string;

  @ApiProperty({ description: "ISO 8601 build date of the running image, or \"unknown\"", example: "2026-11-04T00:49:37.000Z" })
  public builtAt: string;

  @ApiProperty({ description: "Version of the HTTP response contract; bumped when a response shape changes incompatibly", example: 1 })
  public contract: number;
}
