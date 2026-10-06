/*
 * Funcionalidad: Controlador HealthController
 * Descripción: Expone el chequeo de salud del servicio en /, /health y /api/health
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@ApiTags("Health")
@Controller()
export class HealthController {
  @Get(["", "health", "api/health"])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Healthcheck", description: "Returns OK if the application is running" })
  @ApiResponse({ status: HttpStatus.OK, description: "Application is healthy" })
  public healthcheck(): { status: string; timestamp: string } {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
