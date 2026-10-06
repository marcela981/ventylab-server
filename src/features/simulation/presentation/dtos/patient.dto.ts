/*
 * Funcionalidad: DTOs de respuesta del paciente simulado
 * Descripción: Serializan el modelo del paciente simulado (demografía, parámetros calculados, mecánica respiratoria, signos vitales, gasometría y examen físico) y su estado de simulación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import {
  type ArterialBloodGas,
  type PatientCalculatedParams,
  type PatientDemographics,
  type PhysicalExam,
  type RespiratoryMechanics,
  type VitalSigns,
} from "@/features/simulation/domain/value-objects/patient-model";

export class PatientDTO {
  @ApiProperty({ description: "Simulated patient ID", example: "patient-1767225600000-ab12c" })
  public id: string;

  @ApiProperty({ description: "Demographics (name, weight kg, height cm, age, gender)", type: Object })
  public demographics: PatientDemographics;

  @ApiProperty({ description: "Calculated parameters (ideal body weight, BMI, predicted tidal volume, body surface area)", type: Object })
  public calculated: PatientCalculatedParams;

  @ApiProperty({ description: "Respiratory mechanics (compliance, resistance, FRC, intrinsic PEEP)", type: Object })
  public respiratoryMechanics: RespiratoryMechanics;

  @ApiProperty({ description: "Main clinical condition", example: "ARDS_MODERATE" })
  public condition: string;

  @ApiProperty({ description: "Baseline vital signs", type: Object })
  public vitalSigns: VitalSigns;

  @ApiProperty({ description: "Arterial blood gas", type: Object, nullable: true })
  public arterialBloodGas: ArterialBloodGas | null;

  @ApiProperty({ description: "Physical exam", type: Object, nullable: true })
  public physicalExam: PhysicalExam | null;

  @ApiProperty({ description: "Main diagnosis", example: null, nullable: true, type: String })
  public diagnosis: string | null;

  @ApiProperty({ description: "Simulation difficulty", example: "BASIC" })
  public difficultyLevel: string;

  @ApiProperty({ description: "Creation time (ms epoch)", example: 1767225600000 })
  public createdAt: number;

  public constructor({
    id,
    demographics,
    calculated,
    respiratoryMechanics,
    condition,
    vitalSigns,
    arterialBloodGas,
    physicalExam,
    diagnosis,
    difficultyLevel,
    createdAt,
  }: {
    id: string;
    demographics: PatientDemographics;
    calculated: PatientCalculatedParams;
    respiratoryMechanics: RespiratoryMechanics;
    condition: string;
    vitalSigns: VitalSigns;
    arterialBloodGas: ArterialBloodGas | null;
    physicalExam: PhysicalExam | null;
    diagnosis: string | null;
    difficultyLevel: string;
    createdAt: number;
  }) {
    this.id = id;
    this.demographics = demographics;
    this.calculated = calculated;
    this.respiratoryMechanics = respiratoryMechanics;
    this.condition = condition;
    this.vitalSigns = vitalSigns;
    this.arterialBloodGas = arterialBloodGas;
    this.physicalExam = physicalExam;
    this.diagnosis = diagnosis;
    this.difficultyLevel = difficultyLevel;
    this.createdAt = createdAt;
  }
}

export class ActivePatientDTO {
  @ApiProperty({ description: "Configured patient", type: PatientDTO, nullable: true })
  public patient: PatientDTO | null;

  @ApiProperty({ description: "Whether the signal loop is running", example: false })
  public isSimulating: boolean;

  public constructor({ patient, isSimulating }: { patient: PatientDTO | null; isSimulating: boolean }) {
    this.patient = patient;
    this.isSimulating = isSimulating;
  }
}
