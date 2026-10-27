/*
 * Funcionalidad: DTOs de petición de reservas
 * Descripción: Validación y documentación Swagger de la consulta del calendario (desde, hasta y grupo titular opcional), la creación de una reserva (titular, ventana programada o duración de la reserva inmediata, propósito y confirmación de desplazamiento) y el desplazamiento explícito (motivo y nueva reserva)
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { IMMEDIATE_RESERVATION_DURATION_VALUES } from "@/features/reservations/domain/services/reservation-scheduling-rules";
import { RESERVATION_HOLDER_TYPE_VALUES } from "@/features/reservations/domain/value-objects/reservation-holder";

const MAX_TEXT_LENGTH: number = 500;

export class GetReservationsCalendarQueryDTO {
  @ApiProperty({ description: "Start of the range (ISO 8601)", example: "2026-10-12T00:00:00.000Z" })
  @IsISO8601({}, { message: i18nValidationMessage("reservations.validation.date_invalid") })
  public from: string;

  @ApiProperty({ description: "End of the range (ISO 8601, at most 31 days after from)", example: "2026-10-19T00:00:00.000Z" })
  @IsISO8601({}, { message: i18nValidationMessage("reservations.validation.date_invalid") })
  public to: string;

  @ApiPropertyOptional({
    description: "Only reservations held by this group; admins may pass any group, teachers a group they manage or supervise, students their own group",
    example: "cm5group01",
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;
}

export class CreateReservationDTO {
  @ApiProperty({ description: "Who holds the reservation", enum: RESERVATION_HOLDER_TYPE_VALUES, example: "USER" })
  @IsIn([...RESERVATION_HOLDER_TYPE_VALUES], { message: i18nValidationMessage("reservations.validation.holder_type_invalid") })
  public holderType: string;

  @ApiPropertyOptional({ description: "Holder user when holderType is USER (the caller when omitted)", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public userId?: string;

  @ApiPropertyOptional({ description: "Holder group when holderType is GROUP", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;

  @ApiPropertyOptional({
    description: "Start of a scheduled reservation, on a slot boundary (ISO 8601). Omit it for an immediate reservation that starts now (truncated to the minute)",
    example: "2026-10-12T14:00:00.000Z",
  })
  @IsOptional()
  @IsISO8601({}, { message: i18nValidationMessage("reservations.validation.date_invalid") })
  public startsAt?: string;

  @ApiPropertyOptional({ description: "End of a scheduled reservation, on a slot boundary (ISO 8601); required with startsAt", example: "2026-10-12T15:00:00.000Z" })
  @ValidateIf((dto: CreateReservationDTO): boolean => dto.startsAt !== undefined || dto.endsAt !== undefined)
  @IsISO8601({}, { message: i18nValidationMessage("reservations.validation.date_invalid") })
  public endsAt?: string;

  @ApiPropertyOptional({
    description: "Length in minutes of an immediate reservation; required when startsAt is omitted and ignored otherwise",
    enum: IMMEDIATE_RESERVATION_DURATION_VALUES,
    example: 30,
  })
  @ValidateIf((dto: CreateReservationDTO): boolean => dto.startsAt === undefined || dto.durationMinutes !== undefined)
  @IsIn([...IMMEDIATE_RESERVATION_DURATION_VALUES], { message: i18nValidationMessage("reservations.validation.duration_invalid") })
  public durationMinutes?: number;

  @ApiPropertyOptional({ description: "Purpose of the reservation", example: "Practice", maxLength: MAX_TEXT_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_TEXT_LENGTH, { message: i18nValidationMessage("reservations.validation.text_too_long") })
  public purpose?: string;

  @ApiPropertyOptional({ description: "Teachers and admins: preempt the overlapping reservations they are allowed to preempt", example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage("common.validation.boolean") })
  public confirmPreempt?: boolean;
}

export class PreemptReservationDTO {
  @ApiProperty({ description: "Reason shown to the preempted holder", example: "Scheduled class demonstration", maxLength: MAX_TEXT_LENGTH })
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @IsNotEmpty({ message: i18nValidationMessage("reservations.validation.reason_required") })
  @MaxLength(MAX_TEXT_LENGTH, { message: i18nValidationMessage("reservations.validation.text_too_long") })
  public reason: string;

  @ApiProperty({ description: "Who holds the new reservation", enum: RESERVATION_HOLDER_TYPE_VALUES, example: "USER" })
  @IsIn([...RESERVATION_HOLDER_TYPE_VALUES], { message: i18nValidationMessage("reservations.validation.holder_type_invalid") })
  public holderType: string;

  @ApiPropertyOptional({ description: "Holder user of the new reservation (the caller when omitted)", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public userId?: string;

  @ApiPropertyOptional({ description: "Holder group of the new reservation", example: "cm5group01" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public groupId?: string;

  @ApiPropertyOptional({ description: "Start of the new reservation; defaults to the preempted window from the current slot", example: "2026-10-12T14:00:00.000Z" })
  @IsOptional()
  @IsISO8601({}, { message: i18nValidationMessage("reservations.validation.date_invalid") })
  public startsAt?: string;

  @ApiPropertyOptional({ description: "End of the new reservation; defaults to the end of the preempted window", example: "2026-10-12T15:00:00.000Z" })
  @IsOptional()
  @IsISO8601({}, { message: i18nValidationMessage("reservations.validation.date_invalid") })
  public endsAt?: string;

  @ApiPropertyOptional({ description: "Purpose of the new reservation", example: "Class demonstration", maxLength: MAX_TEXT_LENGTH })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  @MaxLength(MAX_TEXT_LENGTH, { message: i18nValidationMessage("reservations.validation.text_too_long") })
  public purpose?: string;
}
