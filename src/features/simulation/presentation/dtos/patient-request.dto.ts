/*
 * Funcionalidad: DTOs de solicitud del paciente simulado
 * Descripción: Validan la configuración del paciente (caso clínico del catálogo o demografía, condición, signos vitales, diagnóstico y dificultad) y el comando inicial del ventilador para arrancar la simulación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { i18nValidationMessage } from "nestjs-i18n";

import { GENDER_VALUES, PATIENT_CONDITION_VALUES, PATIENT_DIFFICULTY_VALUES } from "@/features/simulation/domain/value-objects/patient-model";

export class PatientDemographicsDTO {
  @ApiPropertyOptional({ description: "Patient name (display only)", example: "Juan García" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public name?: string;

  @ApiProperty({ description: "Current weight in kg", example: 75 })
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public weight: number;

  @ApiProperty({ description: "Height in cm", example: 175 })
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public height: number;

  @ApiProperty({ description: "Age in years", example: 45 })
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public age: number;

  @ApiProperty({ description: "Biological sex (affects ideal body weight)", enum: GENDER_VALUES, example: "M" })
  @IsIn([...GENDER_VALUES], { message: i18nValidationMessage("common.validation.enum") })
  public gender: string;
}

export class PatientVitalSignsDTO {
  @ApiPropertyOptional({ description: "Heart rate (bpm), defaults to 80", example: 80 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public heartRate?: number;

  @ApiPropertyOptional({ description: "Spontaneous respiratory rate (rpm), defaults to 14", example: 14 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public respiratoryRate?: number;

  @ApiPropertyOptional({ description: "Baseline SpO2 (%), defaults to 95", example: 95 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public spo2?: number;

  @ApiPropertyOptional({ description: "Systolic blood pressure (mmHg), defaults to 120", example: 120 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public systolicBP?: number;

  @ApiPropertyOptional({ description: "Diastolic blood pressure (mmHg), defaults to 75", example: 75 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public diastolicBP?: number;

  @ApiPropertyOptional({ description: "Temperature (°C), defaults to 36.5", example: 36.5 })
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage("simulation.validation.number") })
  public temperature?: number;
}

export class ConfigurePatientDTO {
  @ApiPropertyOptional({ description: "Predefined simulator clinical case ID; when set, the other fields are ignored", example: "basic-post-surgical" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public clinicalCaseId?: string;

  @ApiPropertyOptional({ description: "Patient demographics (required without clinicalCaseId)", type: PatientDemographicsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientDemographicsDTO)
  public demographics?: PatientDemographicsDTO;

  @ApiPropertyOptional({ description: "Main clinical condition (required without clinicalCaseId)", enum: PATIENT_CONDITION_VALUES, example: "ARDS_MODERATE" })
  @IsOptional()
  @IsIn([...PATIENT_CONDITION_VALUES], { message: i18nValidationMessage("common.validation.enum") })
  public condition?: string;

  @ApiPropertyOptional({ description: "Baseline vital signs; missing values use defaults", type: PatientVitalSignsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => PatientVitalSignsDTO)
  public vitalSigns?: PatientVitalSignsDTO;

  @ApiPropertyOptional({ description: "Main diagnosis (free text)", example: "Community-acquired pneumonia" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage("common.validation.string") })
  public diagnosis?: string;

  @ApiPropertyOptional({ description: "Simulation difficulty, defaults to BASIC", enum: PATIENT_DIFFICULTY_VALUES, example: "BASIC" })
  @IsOptional()
  @IsIn([...PATIENT_DIFFICULTY_VALUES], { message: i18nValidationMessage("common.validation.enum") })
  public difficultyLevel?: string;
}

export class StartPatientSimulationDTO {
  @ApiProperty({
    description: "Initial ventilator settings (mode, tidalVolume, respiratoryRate, peep, fio2, optional inspiratoryTime)",
    type: Object,
    example: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 },
  })
  @IsObject({ message: i18nValidationMessage("simulation.validation.command_required") })
  public command: Record<string, unknown>;
}
