/*
 * Funcionalidad: Mapper de presentación de casos clínicos
 * Descripción: Convierte modelos de lectura y resultados de casos clínicos y evaluaciones a sus DTOs de respuesta (los valores expertos y las diferencias solo se incluyen para quien puede ver la configuración experta), y la configuración del ventilador recibida al modelo de dominio
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ClinicalCaseAttemptsResult,
  type ClinicalCaseDetailResult,
  type ClinicalCaseEvaluationResult,
} from "@/features/clinical-cases/application/results/clinical-case.results";
import {
  type CaseAttemptRecord,
  type CaseAttemptWithImprovement,
  type ClinicalCaseListItem,
  type ClinicalCaseSummary,
} from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  type ParameterComparison,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import {
  ClinicalCaseEvaluationDTO,
  ComparisonSummaryDTO,
  ConfigurationComparisonDTO,
  EvaluationAttemptDTO,
  EvaluationFeedbackDTO,
  EvaluationImprovementDTO,
  ExpertConfigurationDTO,
  ParameterComparisonDTO,
} from "@/features/clinical-cases/presentation/dtos/clinical-case-evaluation.dto";
import { type VentilatorConfigurationDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-request.dto";
import {
  CaseAttemptBriefDTO,
  CaseAttemptDTO,
  CaseAttemptImprovementDTO,
  CaseAttemptStatsDTO,
  CaseRecentAttemptsDTO,
  CaseReferenceDTO,
  CaseUserAttemptsDTO,
  ClinicalCaseAttemptsDTO,
  ClinicalCaseDetailDTO,
  ClinicalCaseDTO,
  ClinicalCaseListItemDTO,
  ClinicalCaseSummaryDTO,
} from "@/features/clinical-cases/presentation/dtos/clinical-case.dto";

export class ClinicalCasesMapper {
  public static toConfiguration(dto: VentilatorConfigurationDTO): VentilatorConfiguration {
    const configuration: VentilatorConfiguration = { ventilationMode: dto.ventilationMode };

    if (dto.tidalVolume !== undefined) configuration.tidalVolume = dto.tidalVolume;
    if (dto.respiratoryRate !== undefined) configuration.respiratoryRate = dto.respiratoryRate;
    if (dto.peep !== undefined) configuration.peep = dto.peep;
    if (dto.fio2 !== undefined) configuration.fio2 = dto.fio2;
    if (dto.maxPressure !== undefined) configuration.maxPressure = dto.maxPressure;
    if (dto.iERatio !== undefined) configuration.iERatio = dto.iERatio;

    return configuration;
  }

  public static toSummaryDTO(clinicalCase: ClinicalCaseSummary): ClinicalCaseSummaryDTO {
    return new ClinicalCaseSummaryDTO({
      id: clinicalCase.id,
      title: clinicalCase.title,
      description: clinicalCase.description,
      patientAge: clinicalCase.patientAge,
      patientWeight: clinicalCase.patientWeight,
      mainDiagnosis: clinicalCase.mainDiagnosis,
      comorbidities: clinicalCase.comorbidities,
      difficulty: clinicalCase.difficulty,
      pathology: clinicalCase.pathology,
      educationalGoal: clinicalCase.educationalGoal,
    });
  }

  public static toListItemDTO(item: ClinicalCaseListItem): ClinicalCaseListItemDTO {
    return new ClinicalCaseListItemDTO({
      clinicalCase: ClinicalCasesMapper.toSummaryDTO(item.clinicalCase),
      userAttempts: new CaseUserAttemptsDTO({
        hasAttempted: item.userAttempts.hasAttempted,
        bestScore: item.userAttempts.bestScore ?? null,
        lastAttempt: item.userAttempts.lastAttempt ?? null,
        isSuccessful: item.userAttempts.isSuccessful,
      }),
    });
  }

  public static toDetailDTO(result: ClinicalCaseDetailResult): ClinicalCaseDetailDTO {
    const { clinicalCase } = result;

    return new ClinicalCaseDetailDTO({
      clinicalCase: new ClinicalCaseDTO({
        id: clinicalCase.id,
        title: clinicalCase.title,
        description: clinicalCase.description,
        patientAge: clinicalCase.patientAge,
        patientWeight: clinicalCase.patientWeight,
        mainDiagnosis: clinicalCase.mainDiagnosis,
        comorbidities: clinicalCase.comorbidities,
        difficulty: clinicalCase.difficulty,
        pathology: clinicalCase.pathology,
        educationalGoal: clinicalCase.educationalGoal,
        labData: clinicalCase.labData ?? null,
      }),
      userAttempts: new CaseRecentAttemptsDTO({
        total: result.totalAttempts,
        bestScore: result.bestScore ?? null,
        lastAttempt: result.lastAttempt ?? null,
        attempts: result.attempts.map(
          (attempt: CaseAttemptRecord) =>
            new CaseAttemptBriefDTO({
              id: attempt.id,
              score: attempt.score,
              isSuccessful: attempt.isSuccessful,
              completedAt: attempt.completedAt ?? null,
            }),
        ),
      }),
    });
  }

  public static toEvaluationDTO(result: ClinicalCaseEvaluationResult, revealExpert: boolean): ClinicalCaseEvaluationDTO {
    const { comparison, feedback, expertConfiguration, improvement } = result;

    return new ClinicalCaseEvaluationDTO({
      attempt: new EvaluationAttemptDTO({
        id: result.attemptId,
        score: result.score,
        isSuccessful: result.isSuccessful,
        completionTime: result.completionTime,
      }),
      comparison: new ConfigurationComparisonDTO({
        score: comparison.score,
        totalParameters: comparison.totalParameters,
        correctParameters: comparison.correctParameters,
        summary: new ComparisonSummaryDTO(comparison.summary),
        parameters: comparison.parameters.map(
          (parameter: ParameterComparison) =>
            new ParameterComparisonDTO({
              parameter: parameter.parameter,
              userValue: parameter.userValue ?? null,
              expertValue: revealExpert ? (parameter.expertValue ?? null) : null,
              difference: revealExpert ? parameter.difference : null,
              differencePercent: revealExpert ? parameter.differencePercent : null,
              withinRange: parameter.withinRange,
              errorClassification: parameter.errorClassification,
              priority: parameter.priority,
            }),
        ),
        criticalErrors: comparison.criticalErrors,
      }),
      feedback: new EvaluationFeedbackDTO({
        text: feedback.feedback,
        strengths: feedback.strengths,
        improvements: feedback.improvements,
        recommendations: feedback.recommendations,
        safetyConcerns: feedback.safetyConcerns ?? null,
      }),
      expertConfiguration: revealExpert
        ? new ExpertConfigurationDTO({
          ventilationMode: expertConfiguration.ventilationMode,
          tidalVolume: expertConfiguration.tidalVolume ?? null,
          respiratoryRate: expertConfiguration.respiratoryRate ?? null,
          peep: expertConfiguration.peep ?? null,
          fio2: expertConfiguration.fio2 ?? null,
          maxPressure: expertConfiguration.maxPressure ?? null,
          iERatio: expertConfiguration.iERatio ?? null,
          justification: expertConfiguration.justification,
        })
        : null,
      improvement: improvement ? new EvaluationImprovementDTO(improvement) : null,
    });
  }

  public static toAttemptsDTO(result: ClinicalCaseAttemptsResult): ClinicalCaseAttemptsDTO {
    return new ClinicalCaseAttemptsDTO({
      clinicalCase: new CaseReferenceDTO({ id: result.caseId, title: result.caseTitle }),
      stats: new CaseAttemptStatsDTO({
        total: result.stats.total,
        successful: result.stats.successful,
        bestScore: result.stats.bestScore ?? null,
        averageScore: result.stats.averageScore ?? null,
        averageTime: result.stats.averageTime ?? null,
      }),
      attempts: result.attempts.map(
        ({ attempt, improvement }: CaseAttemptWithImprovement) =>
          new CaseAttemptDTO({
            id: attempt.id,
            score: attempt.score,
            isSuccessful: attempt.isSuccessful,
            completionTime: attempt.completionTime ?? null,
            completedAt: attempt.completedAt ?? null,
            startedAt: attempt.startedAt,
            improvement: improvement ? new CaseAttemptImprovementDTO(improvement) : null,
          }),
      ),
    });
  }
}
