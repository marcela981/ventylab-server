/*
 * Funcionalidad: DTO del catálogo de proveedores de IA del administrador
 * Descripción: Forma de respuesta documentada en Swagger de cada proveedor de IA: identificador, si tiene credenciales configuradas (nunca las credenciales) y los modelos conocidos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class AdminAiProviderDTO {
  @ApiProperty({ description: "Provider ID (gemini, openai, anthropic or custom)", example: "gemini" })
  public provider: string;

  @ApiProperty({ description: "Whether the provider credentials are configured on the server (the credentials are never returned)", example: true })
  public configured: boolean;

  @ApiProperty({
    description: "Models known to the AI feature for this provider: models of the price table and models referenced by the current use case settings, sorted",
    example: ["gemini-2.0-flash", "gemini-2.5-flash"],
    type: String,
    isArray: true,
  })
  public models: string[];

  public constructor(fields: AdminAiProviderDTO) {
    this.provider = fields.provider;
    this.configured = fields.configured;
    this.models = fields.models;
  }
}
