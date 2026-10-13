/*
 * Funcionalidad: DTOs de las sondas de salud
 * Descripción: Cuerpos sin envoltorio de la sonda de vida (estado y marca de tiempo) y de la sonda de preparación (ready o not_ready)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class LivenessStatusDTO {
  @ApiProperty({ description: "Liveness status", example: "ok", enum: ["ok"] })
  public status: string;

  @ApiProperty({ description: "Server time of the check", example: "2026-10-12T10:00:00.000Z", format: "date-time" })
  public timestamp: string;
}

export class ReadinessStatusDTO {
  @ApiProperty({ description: "Readiness status", example: "ready", enum: ["ready", "not_ready"] })
  public status: string;
}
