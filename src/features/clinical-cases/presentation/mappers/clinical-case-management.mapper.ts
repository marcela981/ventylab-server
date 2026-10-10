/*
 * Funcionalidad: Mapper de gestión de casos clínicos
 * Descripción: Convierte el DTO de creación o reemplazo en el contenido de dominio copiando solo los campos conocidos de cada bloque simulable, y la entidad ClinicalCase en el DTO de definición completa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ClinicalCase, type ClinicalCaseContent } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  type ClinicalCaseEvent,
  type ClinicalCaseMechanics,
  type ClinicalCaseRubric,
  type ClinicalCaseSimulationProfile,
  type ClinicalCaseTargets,
  type ClinicalCaseVentilatorSettings,
  type CaseTargetRange,
  type RubricCriterion,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { type CaseDifficultyValue } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import {
  type AssistancePolicyValue,
  type CaseEventTypeValue,
  type CaseFlowPatternValue,
  type CaseMandatoryBreathTypeValue,
  type CaseTriggerTypeValue,
  type CaseVentilationModeValue,
  type PatientSexValue,
  type RubricCriterionTypeValue,
} from "@/features/clinical-cases/domain/value-objects/clinical-case-simulation-values";
import { type PathologyValue } from "@/features/clinical-cases/domain/value-objects/pathology";
import { ClinicalCaseDefinitionDTO } from "@/features/clinical-cases/presentation/dtos/clinical-case-definition.dto";
import {
  type CaseTargetRangeDTO,
  type ClinicalCaseEventDTO,
  type ClinicalCaseMechanicsDTO,
  type ClinicalCaseRubricDTO,
  type ClinicalCaseTargetsDTO,
  type ClinicalCaseVentilatorSettingsDTO,
  type RecruitmentCurvePointDTO,
  type RubricCriterionDTO,
  type UpsertClinicalCaseDTO,
} from "@/features/clinical-cases/presentation/dtos/clinical-case-management.dto";

export class ClinicalCaseManagementMapper {
  public static toContent(dto: UpsertClinicalCaseDTO): ClinicalCaseContent {
    const simulation: ClinicalCaseSimulationProfile = {
      patientSex: dto.patientSex as PatientSexValue | undefined,
      patientHeightCm: dto.patientHeightCm,
      mechanics: dto.mechanics ? ClinicalCaseManagementMapper._toMechanics(dto.mechanics) : undefined,
      initialVentilatorSettings: dto.initialVentilatorSettings ? ClinicalCaseManagementMapper._toSettings(dto.initialVentilatorSettings) : undefined,
      initialState: dto.initialState ? { paco2MmHg: dto.initialState.paco2MmHg, pao2MmHg: dto.initialState.pao2MmHg } : undefined,
      events: (dto.events ?? []).map((event: ClinicalCaseEventDTO) => ClinicalCaseManagementMapper._toEvent(event)),
      targets: dto.targets ? ClinicalCaseManagementMapper._toTargets(dto.targets) : undefined,
      defaultRubric: dto.defaultRubric ? ClinicalCaseManagementMapper._toRubric(dto.defaultRubric) : undefined,
    };

    return {
      title: dto.title,
      description: dto.description,
      summary: dto.summary,
      history: dto.history ? { presentIllness: dto.history.presentIllness, relevantHistory: [...dto.history.relevantHistory] } : undefined,
      patientAge: dto.patientAge,
      patientWeight: dto.patientWeight,
      mainDiagnosis: dto.mainDiagnosis,
      comorbidities: [...dto.comorbidities],
      labData: dto.labData,
      difficulty: dto.difficulty as CaseDifficultyValue,
      pathology: dto.pathology as PathologyValue,
      educationalGoal: dto.educationalGoal,
      simulation,
    };
  }

  public static toDefinitionDTO(clinicalCase: ClinicalCase): ClinicalCaseDefinitionDTO {
    const { content } = clinicalCase;
    const simulation: ClinicalCaseSimulationProfile = content.simulation;

    return new ClinicalCaseDefinitionDTO({
      id: clinicalCase.id,
      title: content.title,
      description: content.description,
      summary: content.summary ?? null,
      history: content.history ?? null,
      patientAge: content.patientAge,
      patientWeight: content.patientWeight,
      patientSex: simulation.patientSex ?? null,
      patientHeightCm: simulation.patientHeightCm ?? null,
      mainDiagnosis: content.mainDiagnosis,
      comorbidities: [...content.comorbidities],
      labData: content.labData ?? null,
      difficulty: content.difficulty,
      pathology: content.pathology,
      educationalGoal: content.educationalGoal,
      mechanics: simulation.mechanics ?? null,
      initialVentilatorSettings: simulation.initialVentilatorSettings ?? null,
      initialState: simulation.initialState ?? null,
      events: [...simulation.events],
      targets: simulation.targets ?? null,
      defaultRubric: simulation.defaultRubric ?? null,
      status: clinicalCase.status,
      isActive: clinicalCase.isActive,
      validatedByExpert: clinicalCase.validatedByExpert,
      validatedById: clinicalCase.validatedById ?? null,
      createdById: clinicalCase.createdById ?? null,
      simulationReady: clinicalCase.isSimulationReady,
      createdAt: clinicalCase.createdAt,
      updatedAt: clinicalCase.updatedAt,
    });
  }

  private static _toMechanics(dto: ClinicalCaseMechanicsDTO): ClinicalCaseMechanics {
    return {
      complianceMlPerCmH2O: dto.complianceMlPerCmH2O,
      resistanceCmH2OPerLps: dto.resistanceCmH2OPerLps,
      deadSpaceMl: dto.deadSpaceMl,
      vco2MlPerMin: dto.vco2MlPerMin,
      bicarbonateMmolPerL: dto.bicarbonateMmolPerL,
      hemoglobinGPerDl: dto.hemoglobinGPerDl,
      arteriovenousO2DifferenceMlPerDl: dto.arteriovenousO2DifferenceMlPerDl,
      basalShuntFraction: dto.basalShuntFraction,
      recruitmentCurve: dto.recruitmentCurve.map((point: RecruitmentCurvePointDTO) => ({ peepCmH2O: point.peepCmH2O, shuntFraction: point.shuntFraction })),
      patientEffort: {
        amplitudeCmH2O: dto.patientEffort.amplitudeCmH2O,
        rateBpm: dto.patientEffort.rateBpm,
        inspiratoryFraction: dto.patientEffort.inspiratoryFraction,
      },
      hemodynamics: {
        baselineMapMmHg: dto.hemodynamics.baselineMapMmHg,
        meanAirwayPressureThresholdCmH2O: dto.hemodynamics.meanAirwayPressureThresholdCmH2O,
        mapDropPerCmH2O: dto.hemodynamics.mapDropPerCmH2O,
      },
      gasTimeConstants: {
        paco2TimeConstantMin: dto.gasTimeConstants.paco2TimeConstantMin,
        oxygenTimeConstantS: dto.gasTimeConstants.oxygenTimeConstantS,
      },
      deterioration: {
        ratePerMin: dto.deterioration.ratePerMin,
        maxComplianceLossFraction: dto.deterioration.maxComplianceLossFraction,
        maxShuntIncrease: dto.deterioration.maxShuntIncrease,
      },
    };
  }

  private static _toSettings(dto: ClinicalCaseVentilatorSettingsDTO): ClinicalCaseVentilatorSettings {
    return {
      mode: dto.mode as CaseVentilationModeValue,
      tidalVolumeMl: dto.tidalVolumeMl,
      respiratoryRateBpm: dto.respiratoryRateBpm,
      peepCmH2O: dto.peepCmH2O,
      fio2: dto.fio2,
      inspiratoryTimeS: dto.inspiratoryTimeS,
      flowPattern: dto.flowPattern as CaseFlowPatternValue | undefined,
      inspiratoryPauseS: dto.inspiratoryPauseS,
      inspiratoryPressureCmH2O: dto.inspiratoryPressureCmH2O,
      pressureSupportCmH2O: dto.pressureSupportCmH2O,
      triggerType: dto.triggerType as CaseTriggerTypeValue | undefined,
      flowTriggerLpm: dto.flowTriggerLpm,
      pressureTriggerCmH2O: dto.pressureTriggerCmH2O,
      cycleOffPercent: dto.cycleOffPercent,
      apneaTimeS: dto.apneaTimeS,
      simvMandatoryType: dto.simvMandatoryType as CaseMandatoryBreathTypeValue | undefined,
    };
  }

  private static _toEvent(dto: ClinicalCaseEventDTO): ClinicalCaseEvent {
    return {
      simTimeMs: dto.simTimeMs,
      type: dto.type as CaseEventTypeValue,
      resistanceFactor: dto.resistanceFactor,
      complianceFactor: dto.complianceFactor,
      shuntIncrease: dto.shuntIncrease,
      effortAmplitudeCmH2O: dto.effortAmplitudeCmH2O,
      effortRateBpm: dto.effortRateBpm,
    };
  }

  private static _toTargets(dto: ClinicalCaseTargetsDTO): ClinicalCaseTargets {
    return {
      spo2Percent: ClinicalCaseManagementMapper._toRange(dto.spo2Percent),
      paco2MmHg: ClinicalCaseManagementMapper._toRange(dto.paco2MmHg),
      ph: ClinicalCaseManagementMapper._toRange(dto.ph),
      plateauPressureMaxCmH2O: dto.plateauPressureMaxCmH2O,
      drivingPressureMaxCmH2O: dto.drivingPressureMaxCmH2O,
      tidalVolumePerKgPbw: ClinicalCaseManagementMapper._toRange(dto.tidalVolumePerKgPbw),
      autoPeepMaxCmH2O: dto.autoPeepMaxCmH2O,
    };
  }

  private static _toRange(dto: CaseTargetRangeDTO | undefined): CaseTargetRange | undefined {
    return dto ? { min: dto.min, max: dto.max } : undefined;
  }

  private static _toRubric(dto: ClinicalCaseRubricDTO): ClinicalCaseRubric {
    return {
      assistancePolicy: dto.assistancePolicy as AssistancePolicyValue,
      passingScore: dto.passingScore,
      criteria: dto.criteria.map(
        (criterion: RubricCriterionDTO): RubricCriterion => ({
          type: criterion.type as RubricCriterionTypeValue,
          weight: criterion.weight,
          threshold: criterion.threshold,
          windowMinutes: criterion.windowMinutes,
          penaltyPoints: criterion.penaltyPoints,
        }),
      ),
    };
  }
}
