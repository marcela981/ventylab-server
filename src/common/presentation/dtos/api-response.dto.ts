/*
 * Funcionalidad: DTO APIResponse
 * Descripción: Define la forma del envoltorio estándar de respuesta y de su paginación para la documentación y el tipado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class APIPagination {
  @ApiProperty({ description: "Total number of items across all pages", example: 100 })
  public total: number;

  @ApiProperty({ description: "Total number of pages available", example: 10 })
  public pages: number;

  @ApiProperty({ description: "Current page number (1-based)", example: 2 })
  public page: number;

  @ApiProperty({ description: "Number of items per page", example: 10 })
  public limit: number;

  @ApiProperty({ description: "Next page number", example: 3, nullable: true })
  public next: number | null;

  @ApiProperty({ description: "Previous page number", example: 1, nullable: true })
  public previous: number | null;
}

export interface APIResponse<T> {
  success: boolean;
  message: string | string[] | null;
  data: T | null;
  code: string | null;
  timestamp: string;
  traceId: string | null;
  pagination: APIPagination | null;
}
