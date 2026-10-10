/*
 * Funcionalidad: DTOs de respuesta de la definición de casos clínicos
 * Descripción: Serializa la definición completa de un caso clínico para su edición por docentes (contenido, bloques simulables, estado, validación por experto) y el identificador del caso creado o duplicado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

import {
  type ClinicalCaseEvent,
  type ClinicalCaseHistory,
  type ClinicalCaseInitialState,
  type ClinicalCaseMechanics,
  type ClinicalCaseRubric,
  type ClinicalCaseTargets,
  type ClinicalCaseVentilatorSettings,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";

export class ClinicalCaseIdDTO {
  @ApiProperty({ description: "Identifier of the created clinical case", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  public constructor({ id }: { id: string }) {
    this.id = id;
  }
}

export interface ClinicalCaseDefinitionFields {
  id: string;
  title: string;
  description: string;
  summary: string | null;
  history: ClinicalCaseHistory | null;
  patientAge: number;
  patientWeight: number;
  patientSex: string | null;
  patientHeightCm: number | null;
  mainDiagnosis: string;
  comorbidities: string[];
  labData: unknown;
  difficulty: string;
  pathology: string;
  educationalGoal: string;
  mechanics: ClinicalCaseMechanics | null;
  initialVentilatorSettings: ClinicalCaseVentilatorSettings | null;
  initialState: ClinicalCaseInitialState | null;
  events: ClinicalCaseEvent[];
  targets: ClinicalCaseTargets | null;
  defaultRubric: ClinicalCaseRubric | null;
  status: string;
  isActive: boolean;
  validatedByExpert: boolean;
  validatedById: string | null;
  createdById: string | null;
  simulationReady: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ClinicalCaseDefinitionDTO {
  @ApiProperty({ description: "Clinical case unique identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Case title", example: "ARDS in an obese patient" })
  public title: string;

  @ApiProperty({ description: "Case description", example: "A 52-year-old patient with pneumonia-related ARDS" })
  public description: string;

  @ApiProperty({ description: "Short summary", example: "Moderate ARDS, BMI 40", nullable: true, type: String })
  public summary: string | null;

  @ApiProperty({ description: "Clinical history", example: { presentIllness: "Dyspnea", relevantHistory: [] }, nullable: true, type: Object })
  public history: ClinicalCaseHistory | null;

  @ApiProperty({ description: "Patient age in years", example: 52 })
  public patientAge: number;

  @ApiProperty({ description: "Patient weight in kg", example: 120 })
  public patientWeight: number;

  @ApiProperty({ description: "Patient sex", example: "FEMALE", nullable: true, type: String })
  public patientSex: string | null;

  @ApiProperty({ description: "Patient height in cm", example: 165, nullable: true, type: Number })
  public patientHeightCm: number | null;

  @ApiProperty({ description: "Main diagnosis", example: "SDRA moderado" })
  public mainDiagnosis: string;

  @ApiProperty({ description: "Comorbidities", example: ["Obesidad"], type: String, isArray: true })
  public comorbidities: string[];

  @ApiProperty({ description: "Laboratory data", example: { ph: 7.3 }, nullable: true, type: Object })
  public labData: unknown;

  @ApiProperty({ description: "Difficulty", example: "INTERMEDIATE" })
  public difficulty: string;

  @ApiProperty({ description: "Pathology", example: "SDRA" })
  public pathology: string;

  @ApiProperty({ description: "Educational goal", example: "Apply protective ventilation" })
  public educationalGoal: string;

  @ApiProperty({ description: "Respiratory mechanics and physiology", example: { complianceMlPerCmH2O: 30 }, nullable: true, type: Object })
  public mechanics: ClinicalCaseMechanics | null;

  @ApiProperty({ description: "Initial ventilator settings", example: { mode: "VCV", tidalVolumeMl: 420 }, nullable: true, type: Object })
  public initialVentilatorSettings: ClinicalCaseVentilatorSettings | null;

  @ApiProperty({ description: "Initial blood gases", example: { paco2MmHg: 48, pao2MmHg: 62 }, nullable: true, type: Object })
  public initialState: ClinicalCaseInitialState | null;

  @ApiProperty({ description: "Scheduled events", example: [{ simTimeMs: 300000, type: "SECRETIONS", resistanceFactor: 1.5 }], type: Object, isArray: true })
  public events: ClinicalCaseEvent[];

  @ApiProperty({ description: "Clinical targets", example: { plateauPressureMaxCmH2O: 30 }, nullable: true, type: Object })
  public targets: ClinicalCaseTargets | null;

  @ApiProperty({ description: "Default scoring rubric", example: { assistancePolicy: "DISABLED", passingScore: 70, criteria: [] }, nullable: true, type: Object })
  public defaultRubric: ClinicalCaseRubric | null;

  @ApiProperty({ description: "Publication status", example: "DRAFT" })
  public status: string;

  @ApiProperty({ description: "Legacy active flag, true only when published", example: false })
  public isActive: boolean;

  @ApiProperty({ description: "Whether an expert validated the case", example: false })
  public validatedByExpert: boolean;

  @ApiProperty({ description: "User that validated the case", example: null, nullable: true, type: String })
  public validatedById: string | null;

  @ApiProperty({ description: "User that created the case", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f", nullable: true, type: String })
  public createdById: string | null;

  @ApiProperty({ description: "Whether the case has every block the simulation engine needs", example: true })
  public simulationReady: boolean;

  @ApiProperty({ description: "Creation date", example: "2026-10-08T10:00:00.000Z", type: Date })
  public createdAt: Date;

  @ApiProperty({ description: "Last update date", example: "2026-10-08T10:00:00.000Z", type: Date })
  public updatedAt: Date;

  public constructor(fields: ClinicalCaseDefinitionFields) {
    this.id = fields.id;
    this.title = fields.title;
    this.description = fields.description;
    this.summary = fields.summary;
    this.history = fields.history;
    this.patientAge = fields.patientAge;
    this.patientWeight = fields.patientWeight;
    this.patientSex = fields.patientSex;
    this.patientHeightCm = fields.patientHeightCm;
    this.mainDiagnosis = fields.mainDiagnosis;
    this.comorbidities = fields.comorbidities;
    this.labData = fields.labData;
    this.difficulty = fields.difficulty;
    this.pathology = fields.pathology;
    this.educationalGoal = fields.educationalGoal;
    this.mechanics = fields.mechanics;
    this.initialVentilatorSettings = fields.initialVentilatorSettings;
    this.initialState = fields.initialState;
    this.events = fields.events;
    this.targets = fields.targets;
    this.defaultRubric = fields.defaultRubric;
    this.status = fields.status;
    this.isActive = fields.isActive;
    this.validatedByExpert = fields.validatedByExpert;
    this.validatedById = fields.validatedById;
    this.createdById = fields.createdById;
    this.simulationReady = fields.simulationReady;
    this.createdAt = fields.createdAt;
    this.updatedAt = fields.updatedAt;
  }
}
