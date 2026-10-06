/*
 * Funcionalidad: DTOs de respuesta de casos clínicos
 * Descripción: Serialización de casos clínicos (listado con resumen de intentos, detalle con últimos intentos) y del historial de intentos con estadísticas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class CaseUserAttemptsDTO {
  @ApiProperty({ description: "Whether the user attempted the case", example: true })
  public hasAttempted: boolean;

  @ApiProperty({ description: "Best score of the user in the case", example: 85.5, nullable: true, type: Number })
  public bestScore: number | null;

  @ApiProperty({ description: "Completion date of the attempt used as reference", example: "2026-01-15T10:00:00.000Z", nullable: true, type: Date })
  public lastAttempt: Date | null;

  @ApiProperty({ description: "Whether the reference attempt was successful", example: true })
  public isSuccessful: boolean;

  public constructor({
    hasAttempted,
    bestScore,
    lastAttempt,
    isSuccessful,
  }: {
    hasAttempted: boolean;
    bestScore: number | null;
    lastAttempt: Date | null;
    isSuccessful: boolean;
  }) {
    this.hasAttempted = hasAttempted;
    this.bestScore = bestScore;
    this.lastAttempt = lastAttempt;
    this.isSuccessful = isSuccessful;
  }
}

export class ClinicalCaseSummaryDTO {
  @ApiProperty({ description: "Clinical case unique identifier", example: "cm5case01" })
  public id: string;

  @ApiProperty({ description: "Case title", example: "COPD exacerbation" })
  public title: string;

  @ApiProperty({ description: "Case description", example: "A 65-year-old patient with acute respiratory failure" })
  public description: string;

  @ApiProperty({ description: "Patient age in years", example: 65 })
  public patientAge: number;

  @ApiProperty({ description: "Patient weight in kg", example: 70 })
  public patientWeight: number;

  @ApiProperty({ description: "Main diagnosis", example: "EPOC reagudizado" })
  public mainDiagnosis: string;

  @ApiProperty({ description: "Comorbidities", example: ["HTA"], type: String, isArray: true })
  public comorbidities: string[];

  @ApiProperty({ description: "Difficulty", example: "BEGINNER" })
  public difficulty: string;

  @ApiProperty({ description: "Pathology", example: "EPOC" })
  public pathology: string;

  @ApiProperty({ description: "Educational goal", example: "Configure protective ventilation" })
  public educationalGoal: string;

  public constructor({
    id,
    title,
    description,
    patientAge,
    patientWeight,
    mainDiagnosis,
    comorbidities,
    difficulty,
    pathology,
    educationalGoal,
  }: {
    id: string;
    title: string;
    description: string;
    patientAge: number;
    patientWeight: number;
    mainDiagnosis: string;
    comorbidities: string[];
    difficulty: string;
    pathology: string;
    educationalGoal: string;
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.patientAge = patientAge;
    this.patientWeight = patientWeight;
    this.mainDiagnosis = mainDiagnosis;
    this.comorbidities = comorbidities;
    this.difficulty = difficulty;
    this.pathology = pathology;
    this.educationalGoal = educationalGoal;
  }
}

export class ClinicalCaseListItemDTO {
  @ApiProperty({ description: "Clinical case", type: ClinicalCaseSummaryDTO })
  public clinicalCase: ClinicalCaseSummaryDTO;

  @ApiProperty({ description: "Attempts summary of the authenticated user", type: CaseUserAttemptsDTO })
  public userAttempts: CaseUserAttemptsDTO;

  public constructor({ clinicalCase, userAttempts }: { clinicalCase: ClinicalCaseSummaryDTO; userAttempts: CaseUserAttemptsDTO }) {
    this.clinicalCase = clinicalCase;
    this.userAttempts = userAttempts;
  }
}

export class ClinicalCaseDTO extends ClinicalCaseSummaryDTO {
  @ApiProperty({ description: "Laboratory data (blood gases and others)", example: { pH: 7.3 }, nullable: true, type: Object })
  public labData: unknown;

  public constructor({
    labData,
    ...summary
  }: {
    id: string;
    title: string;
    description: string;
    patientAge: number;
    patientWeight: number;
    mainDiagnosis: string;
    comorbidities: string[];
    difficulty: string;
    pathology: string;
    educationalGoal: string;
    labData: unknown;
  }) {
    super(summary);
    this.labData = labData;
  }
}

export class CaseAttemptBriefDTO {
  @ApiProperty({ description: "Attempt identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Score from 0 to 100", example: 85.5 })
  public score: number;

  @ApiProperty({ description: "Whether the score reached 70", example: true })
  public isSuccessful: boolean;

  @ApiProperty({ description: "Completion date", example: "2026-01-15T10:00:00.000Z", nullable: true, type: Date })
  public completedAt: Date | null;

  public constructor({ id, score, isSuccessful, completedAt }: { id: string; score: number; isSuccessful: boolean; completedAt: Date | null }) {
    this.id = id;
    this.score = score;
    this.isSuccessful = isSuccessful;
    this.completedAt = completedAt;
  }
}

export class CaseRecentAttemptsDTO {
  @ApiProperty({ description: "Number of recent attempts returned (up to 5)", example: 2 })
  public total: number;

  @ApiProperty({ description: "Best score among the recent attempts", example: 85.5, nullable: true, type: Number })
  public bestScore: number | null;

  @ApiProperty({ description: "Completion date of the most recent attempt", example: "2026-01-15T10:00:00.000Z", nullable: true, type: Date })
  public lastAttempt: Date | null;

  @ApiProperty({ description: "Recent attempts, most recent first", type: CaseAttemptBriefDTO, isArray: true })
  public attempts: CaseAttemptBriefDTO[];

  public constructor({
    total,
    bestScore,
    lastAttempt,
    attempts,
  }: {
    total: number;
    bestScore: number | null;
    lastAttempt: Date | null;
    attempts: CaseAttemptBriefDTO[];
  }) {
    this.total = total;
    this.bestScore = bestScore;
    this.lastAttempt = lastAttempt;
    this.attempts = attempts;
  }
}

export class ClinicalCaseDetailDTO {
  @ApiProperty({ description: "Clinical case without the expert configuration", type: ClinicalCaseDTO })
  public clinicalCase: ClinicalCaseDTO;

  @ApiProperty({ description: "Recent attempts of the authenticated user", type: CaseRecentAttemptsDTO })
  public userAttempts: CaseRecentAttemptsDTO;

  public constructor({ clinicalCase, userAttempts }: { clinicalCase: ClinicalCaseDTO; userAttempts: CaseRecentAttemptsDTO }) {
    this.clinicalCase = clinicalCase;
    this.userAttempts = userAttempts;
  }
}

export class CaseAttemptImprovementDTO {
  @ApiProperty({ description: "Score of the attempt it is compared with", example: 70 })
  public previousScore: number;

  @ApiProperty({ description: "Score difference", example: 15.5 })
  public difference: number;

  @ApiProperty({ description: "Whether the score improved", example: true })
  public improved: boolean;

  public constructor({ previousScore, difference, improved }: { previousScore: number; difference: number; improved: boolean }) {
    this.previousScore = previousScore;
    this.difference = difference;
    this.improved = improved;
  }
}

export class CaseAttemptDTO {
  @ApiProperty({ description: "Attempt identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Score from 0 to 100", example: 85.5 })
  public score: number;

  @ApiProperty({ description: "Whether the score reached 70", example: true })
  public isSuccessful: boolean;

  @ApiProperty({ description: "Resolution time in seconds", example: 4, nullable: true, type: Number })
  public completionTime: number | null;

  @ApiProperty({ description: "Completion date", example: "2026-01-15T10:00:00.000Z", nullable: true, type: Date })
  public completedAt: Date | null;

  @ApiProperty({ description: "Start date", example: "2026-01-15T10:00:00.000Z" })
  public startedAt: Date;

  @ApiProperty({ description: "Change against the previous item of the list", type: CaseAttemptImprovementDTO, nullable: true })
  public improvement: CaseAttemptImprovementDTO | null;

  public constructor({
    id,
    score,
    isSuccessful,
    completionTime,
    completedAt,
    startedAt,
    improvement,
  }: {
    id: string;
    score: number;
    isSuccessful: boolean;
    completionTime: number | null;
    completedAt: Date | null;
    startedAt: Date;
    improvement: CaseAttemptImprovementDTO | null;
  }) {
    this.id = id;
    this.score = score;
    this.isSuccessful = isSuccessful;
    this.completionTime = completionTime;
    this.completedAt = completedAt;
    this.startedAt = startedAt;
    this.improvement = improvement;
  }
}

export class CaseAttemptStatsDTO {
  @ApiProperty({ description: "Total attempts", example: 3 })
  public total: number;

  @ApiProperty({ description: "Successful attempts", example: 2 })
  public successful: number;

  @ApiProperty({ description: "Best score", example: 90, nullable: true, type: Number })
  public bestScore: number | null;

  @ApiProperty({ description: "Average score", example: 78.3, nullable: true, type: Number })
  public averageScore: number | null;

  @ApiProperty({ description: "Average resolution time in seconds", example: 5, nullable: true, type: Number })
  public averageTime: number | null;

  public constructor({
    total,
    successful,
    bestScore,
    averageScore,
    averageTime,
  }: {
    total: number;
    successful: number;
    bestScore: number | null;
    averageScore: number | null;
    averageTime: number | null;
  }) {
    this.total = total;
    this.successful = successful;
    this.bestScore = bestScore;
    this.averageScore = averageScore;
    this.averageTime = averageTime;
  }
}

export class CaseReferenceDTO {
  @ApiProperty({ description: "Clinical case identifier", example: "cm5case01" })
  public id: string;

  @ApiProperty({ description: "Clinical case title", example: "COPD exacerbation" })
  public title: string;

  public constructor({ id, title }: { id: string; title: string }) {
    this.id = id;
    this.title = title;
  }
}

export class ClinicalCaseAttemptsDTO {
  @ApiProperty({ description: "Clinical case", type: CaseReferenceDTO })
  public clinicalCase: CaseReferenceDTO;

  @ApiProperty({ description: "Attempt statistics", type: CaseAttemptStatsDTO })
  public stats: CaseAttemptStatsDTO;

  @ApiProperty({ description: "Attempts, most recent first", type: CaseAttemptDTO, isArray: true })
  public attempts: CaseAttemptDTO[];

  public constructor({ clinicalCase, stats, attempts }: { clinicalCase: CaseReferenceDTO; stats: CaseAttemptStatsDTO; attempts: CaseAttemptDTO[] }) {
    this.clinicalCase = clinicalCase;
    this.stats = stats;
    this.attempts = attempts;
  }
}
