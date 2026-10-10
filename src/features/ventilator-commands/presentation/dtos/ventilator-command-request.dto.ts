/*
 * Funcionalidad: DTOs de petición de los comandos del ventilador
 * Descripción: Cuerpo tipado del comando del ventilador físico (modo con @IsIn y cada parámetro como número finito, de modo que cadenas, NaN e infinitos se rechazan antes del dominio) y consulta paginada del historial de comandos de una reserva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { ListQueryDTO } from "@/common/presentation/dtos/list-query.dto";
import { VENTILATOR_COMMAND_MODE_VALUES } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

const FINITE_NUMBER: { allowNaN: boolean; allowInfinity: boolean } = { allowNaN: false, allowInfinity: false };
const NUMBER_MESSAGE: string = "ventilator-commands.validation.number";

export class SendVentilatorCommandRequestDTO {
  @ApiProperty({ description: "Ventilation mode; required parameters depend on it (see docs/ventilator/commands.md)", enum: VENTILATOR_COMMAND_MODE_VALUES, example: "VCV" })
  @IsIn([...VENTILATOR_COMMAND_MODE_VALUES], { message: i18nValidationMessage("ventilator-commands.validation.mode_invalid") })
  public mode: string;

  @ApiPropertyOptional({ description: "Tidal volume in mL (VCV, SIMV)", example: 450 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public tidalVolume?: number;

  @ApiPropertyOptional({ description: "Respiratory rate in breaths/min (VCV, PCV, SIMV)", example: 14 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public respiratoryRate?: number;

  @ApiPropertyOptional({ description: "PEEP in cmH2O (all modes)", example: 5 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public peep?: number;

  @ApiPropertyOptional({ description: "Inspired oxygen fraction, 0.21 to 1 (all modes)", example: 0.4 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public fio2?: number;

  @ApiPropertyOptional({ description: "Pressure limit in cmH2O, greater than PEEP (PCV, PSV)", example: 25 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public pressureLimit?: number;

  @ApiPropertyOptional({ description: "Inspiratory time in seconds (PCV)", example: 1 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public inspiratoryTime?: number;

  @ApiPropertyOptional({ description: "I:E ratio as inspiratory over expiratory time (0.5 means 1:2)", example: 0.5 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public ieRatio?: number;

  @ApiPropertyOptional({ description: "Inspiratory flow in L/min", example: 60 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public flowRate?: number;

  @ApiPropertyOptional({ description: "Flow trigger sensitivity in L/min", example: 2 })
  @IsOptional()
  @IsNumber(FINITE_NUMBER, { message: i18nValidationMessage(NUMBER_MESSAGE) })
  public sensitivity?: number;
}

export class GetVentilatorCommandsQueryDTO extends ListQueryDTO {
  @ApiProperty({ description: "Reservation whose commands are listed", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("ventilator-commands.validation.reservation_id_required") })
  public reservationId: string;
}
