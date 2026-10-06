/*
 * Funcionalidad: DTOs change-log-stats.dto
 * Descripción: Define los DTOs ChangeLogStatsDTO de la feature de historial de cambios, documentados para Swagger y validados con class-validator cuando son de entrada
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class ChangeLogStatsDTO {
  @ApiProperty({ description: "Total changes in the period", example: 42 })
  public totalChanges: number;

  @ApiProperty({ description: "Change count per entity type", example: { Level: 10, Module: 32 }, type: Object })
  public byEntityType: Record<string, number>;

  @ApiProperty({ description: "Change count per action", example: { create: 5, update: 37 }, type: Object })
  public byAction: Record<string, number>;

  public constructor({ totalChanges, byEntityType, byAction }: ChangeLogStatsDTO) {
    this.totalChanges = totalChanges;
    this.byEntityType = byEntityType;
    this.byAction = byAction;
  }
}
