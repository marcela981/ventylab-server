/*
 * Funcionalidad: DTOs de respuesta de evaluación de casos clínicos
 * Descripción: Serialización del resultado de evaluar un caso (intento, comparación por parámetro, retroalimentación, configuración experta y mejora)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ApiProperty } from "@nestjs/swagger";

export class EvaluationAttemptDTO {
  @ApiProperty({ description: "Created attempt identifier", example: "01932e9f-1234-7abc-9def-1a2b3c4d5e6f" })
  public id: string;

  @ApiProperty({ description: "Score from 0 to 100", example: 85.5 })
  public score: number;

  @ApiProperty({ description: "Whether the score reached 70", example: true })
  public isSuccessful: boolean;

  @ApiProperty({ description: "Resolution time in seconds", example: 4 })
  public completionTime: number;

  public constructor({ id, score, isSuccessful, completionTime }: { id: string; score: number; isSuccessful: boolean; completionTime: number }) {
    this.id = id;
    this.score = score;
    this.isSuccessful = isSuccessful;
    this.completionTime = completionTime;
  }
}

export class ComparisonSummaryDTO {
  @ApiProperty({ description: "Correct parameters", example: 4 })
  public correct: number;

  @ApiProperty({ description: "Minor errors", example: 1 })
  public minor: number;

  @ApiProperty({ description: "Moderate errors", example: 0 })
  public moderate: number;

  @ApiProperty({ description: "Critical errors", example: 1 })
  public critical: number;

  public constructor({ correct, minor, moderate, critical }: { correct: number; minor: number; moderate: number; critical: number }) {
    this.correct = correct;
    this.minor = minor;
    this.moderate = moderate;
    this.critical = critical;
  }
}

export class ParameterComparisonDTO {
  @ApiProperty({ description: "Parameter key", example: "peep" })
  public parameter: string;

  @ApiProperty({ description: "Value configured by the student", example: 8, nullable: true, oneOf: [{ type: "number" }, { type: "string" }] })
  public userValue: number | string | null;

  @ApiProperty({ description: "Expert value", example: 5, nullable: true, oneOf: [{ type: "number" }, { type: "string" }] })
  public expertValue: number | string | null;

  @ApiProperty({ description: "Absolute difference", example: 3, nullable: true, type: Number })
  public difference: number | null;

  @ApiProperty({ description: "Difference percentage against the expert value", example: 60, nullable: true, type: Number })
  public differencePercent: number | null;

  @ApiProperty({ description: "Whether the value is inside the acceptable range or tolerance", example: false })
  public withinRange: boolean;

  @ApiProperty({ description: "Error classification", example: "moderado", enum: ["correcto", "menor", "moderado", "critico"] })
  public errorClassification: string;

  @ApiProperty({ description: "Parameter priority", example: "IMPORTANTE" })
  public priority: string;

  public constructor({
    parameter,
    userValue,
    expertValue,
    difference,
    differencePercent,
    withinRange,
    errorClassification,
    priority,
  }: {
    parameter: string;
    userValue: number | string | null;
    expertValue: number | string | null;
    difference: number | null;
    differencePercent: number | null;
    withinRange: boolean;
    errorClassification: string;
    priority: string;
  }) {
    this.parameter = parameter;
    this.userValue = userValue;
    this.expertValue = expertValue;
    this.difference = difference;
    this.differencePercent = differencePercent;
    this.withinRange = withinRange;
    this.errorClassification = errorClassification;
    this.priority = priority;
  }
}

export class ConfigurationComparisonDTO {
  @ApiProperty({ description: "Weighted score from 0 to 100", example: 85.5 })
  public score: number;

  @ApiProperty({ description: "Compared parameters", example: 6 })
  public totalParameters: number;

  @ApiProperty({ description: "Correct parameters", example: 4 })
  public correctParameters: number;

  @ApiProperty({ description: "Classification counters", type: ComparisonSummaryDTO })
  public summary: ComparisonSummaryDTO;

  @ApiProperty({ description: "Per-parameter comparison", type: ParameterComparisonDTO, isArray: true })
  public parameters: ParameterComparisonDTO[];

  @ApiProperty({ description: "Labels of parameters with critical errors", example: ["PEEP"], type: String, isArray: true })
  public criticalErrors: string[];

  public constructor({
    score,
    totalParameters,
    correctParameters,
    summary,
    parameters,
    criticalErrors,
  }: {
    score: number;
    totalParameters: number;
    correctParameters: number;
    summary: ComparisonSummaryDTO;
    parameters: ParameterComparisonDTO[];
    criticalErrors: string[];
  }) {
    this.score = score;
    this.totalParameters = totalParameters;
    this.correctParameters = correctParameters;
    this.summary = summary;
    this.parameters = parameters;
    this.criticalErrors = criticalErrors;
  }
}

export class EvaluationFeedbackDTO {
  @ApiProperty({ description: "Main feedback text", example: "Your configuration is close to the expert one..." })
  public text: string;

  @ApiProperty({ description: "Strengths", example: ["peep está correctamente configurado"], type: String, isArray: true })
  public strengths: string[];

  @ApiProperty({ description: "Areas to improve", example: ["fio2 necesita ajuste (diferencia: 10)"], type: String, isArray: true })
  public improvements: string[];

  @ApiProperty({ description: "Recommendations", example: ["Ajusta fio2 hacia 40"], type: String, isArray: true })
  public recommendations: string[];

  @ApiProperty({ description: "Safety concerns", example: ["Revisa los parámetros críticos fuera de rango"], type: String, isArray: true, nullable: true })
  public safetyConcerns: string[] | null;

  public constructor({
    text,
    strengths,
    improvements,
    recommendations,
    safetyConcerns,
  }: {
    text: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    safetyConcerns: string[] | null;
  }) {
    this.text = text;
    this.strengths = strengths;
    this.improvements = improvements;
    this.recommendations = recommendations;
    this.safetyConcerns = safetyConcerns;
  }
}

export class ExpertConfigurationDTO {
  @ApiProperty({ description: "Ventilation mode", example: "volume" })
  public ventilationMode: string;

  @ApiProperty({ description: "Tidal volume in ml", example: 450, nullable: true, type: Number })
  public tidalVolume: number | null;

  @ApiProperty({ description: "Respiratory rate", example: 14, nullable: true, type: Number })
  public respiratoryRate: number | null;

  @ApiProperty({ description: "PEEP in cmH2O", example: 5, nullable: true, type: Number })
  public peep: number | null;

  @ApiProperty({ description: "FiO2 percentage", example: 40, nullable: true, type: Number })
  public fio2: number | null;

  @ApiProperty({ description: "Maximum pressure in cmH2O", example: 30, nullable: true, type: Number })
  public maxPressure: number | null;

  @ApiProperty({ description: "I:E ratio", example: "1:2", nullable: true, type: String })
  public iERatio: string | null;

  @ApiProperty({ description: "Expert justification", example: "Protective ventilation with low tidal volume" })
  public justification: string;

  public constructor({
    ventilationMode,
    tidalVolume,
    respiratoryRate,
    peep,
    fio2,
    maxPressure,
    iERatio,
    justification,
  }: {
    ventilationMode: string;
    tidalVolume: number | null;
    respiratoryRate: number | null;
    peep: number | null;
    fio2: number | null;
    maxPressure: number | null;
    iERatio: string | null;
    justification: string;
  }) {
    this.ventilationMode = ventilationMode;
    this.tidalVolume = tidalVolume;
    this.respiratoryRate = respiratoryRate;
    this.peep = peep;
    this.fio2 = fio2;
    this.maxPressure = maxPressure;
    this.iERatio = iERatio;
    this.justification = justification;
  }
}

export class EvaluationImprovementDTO {
  @ApiProperty({ description: "Score of the previous attempt", example: 70 })
  public previousScore: number;

  @ApiProperty({ description: "Score of this attempt", example: 85.5 })
  public currentScore: number;

  @ApiProperty({ description: "Score difference", example: 15.5 })
  public difference: number;

  @ApiProperty({ description: "Whether the score improved", example: true })
  public improved: boolean;

  public constructor({
    previousScore,
    currentScore,
    difference,
    improved,
  }: {
    previousScore: number;
    currentScore: number;
    difference: number;
    improved: boolean;
  }) {
    this.previousScore = previousScore;
    this.currentScore = currentScore;
    this.difference = difference;
    this.improved = improved;
  }
}

export class ClinicalCaseEvaluationDTO {
  @ApiProperty({ description: "Recorded attempt", type: EvaluationAttemptDTO })
  public attempt: EvaluationAttemptDTO;

  @ApiProperty({ description: "Comparison against the expert configuration", type: ConfigurationComparisonDTO })
  public comparison: ConfigurationComparisonDTO;

  @ApiProperty({ description: "AI generated feedback, or the deterministic fallback", type: EvaluationFeedbackDTO })
  public feedback: EvaluationFeedbackDTO;

  @ApiProperty({ description: "Expert configuration of the case", type: ExpertConfigurationDTO })
  public expertConfiguration: ExpertConfigurationDTO;

  @ApiProperty({ description: "Change against the previous attempt", type: EvaluationImprovementDTO, nullable: true })
  public improvement: EvaluationImprovementDTO | null;

  public constructor({
    attempt,
    comparison,
    feedback,
    expertConfiguration,
    improvement,
  }: {
    attempt: EvaluationAttemptDTO;
    comparison: ConfigurationComparisonDTO;
    feedback: EvaluationFeedbackDTO;
    expertConfiguration: ExpertConfigurationDTO;
    improvement: EvaluationImprovementDTO | null;
  }) {
    this.attempt = attempt;
    this.comparison = comparison;
    this.feedback = feedback;
    this.expertConfiguration = expertConfiguration;
    this.improvement = improvement;
  }
}
