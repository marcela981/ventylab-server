/*
 * Funcionalidad: Mapeo de caso clínico a caso del motor
 * Descripción: Convierte la instantánea de un caso clínico entregada por ClinicalCasesFacade en el caso del motor fisiológico (paciente, mecánica, esfuerzo, intercambio gaseoso con la curva de reclutamiento o el shunt basal, hemodinamia, deterioro, ajustes iniciales, eventos y objetivos) y en el resumen sin datos personales que usa la asistencia; devuelve undefined si el perfil de simulación está incompleto; aplica sobre la instantánea los ajustes ya resueltos del paciente propio de una sesión (edad, peso, sexo, talla, compliance, resistencia, frecuencia respiratoria inicial, PaO2 inicial y PAM basal). v1.2: agrega la evolución del paciente (la del caso o una derivada del deterioro) solo para sesiones del motor 2.0.0 o posterior
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ClinicalCaseEvent,
  type ClinicalCaseEvolution,
  type ClinicalCaseMechanics,
  type ClinicalCaseSimulationProfile,
  type ClinicalCaseSnapshot,
  type ClinicalCaseVentilatorSettings,
  type RecruitmentCurvePoint,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { type AssistCaseSummary } from "@/features/simulation/domain/assist/assist-snapshot";
import {
  type CaseEvent,
  DEFAULT_EVOLUTION_THRESHOLDS,
  ENGINE_VERSION,
  type EngineCase,
  engineSupportsEvolution,
  type EvolutionProfile,
  type EvolutionThresholds,
  type ShuntCurvePoint,
  type VentilatorSettings,
} from "@/features/simulation/domain/engine";
import { type PatientOverrides } from "@/features/simulation/domain/patient/patient-overrides";

export interface SimulationCaseDefinition {
  readonly id: string;
  readonly status: string;
  readonly engineCase: EngineCase;
  readonly summary: AssistCaseSummary;
  readonly defaultRubric?: unknown;
}

/**
 * Evolution derived for cases without their own block (educational convention, pending expert validation): the
 * deterioration rate drives the progression, recovery is half of it, arrest after 10 patient-minutes of critical
 * exposure and death 2 minutes later; baseline heart rate 80 bpm.
 */
export const DERIVED_EVOLUTION_DEFAULTS: Omit<EvolutionProfile, "progressionRatePerMin" | "recoveryRatePerMin"> = {
  initialSeverity: 0,
  minSeverity: 0,
  viliRatePerMin: 0,
  arrestAfterCriticalMin: 10,
  deathAfterArrestMin: 2,
  baselineHeartRateBpm: 80,
};

// The simulator cannot give fluids or vasopressors, so a case that starts in shock must not die from its own
// baseline MAP: the hypotension and critical MAP thresholds sit below the baseline of the case (modelling assumption).
const HYPOTENSION_MARGIN_BELOW_BASELINE_MMHG: number = 5;
const CRITICAL_MARGIN_BELOW_BASELINE_MMHG: number = 20;

export class SimulationCaseMapper {
  public static toDefinition(
    snapshot: ClinicalCaseSnapshot,
    engineVersion: string = ENGINE_VERSION,
  ): SimulationCaseDefinition | undefined {
    const simulation: ClinicalCaseSimulationProfile = snapshot.simulation;
    const { patientSex, patientHeightCm, mechanics, initialVentilatorSettings, initialState } = simulation;

    if (
      patientSex === undefined ||
      patientHeightCm === undefined ||
      mechanics === undefined ||
      initialVentilatorSettings === undefined ||
      initialState === undefined
    ) {
      return undefined;
    }

    const engineCase: EngineCase = {
      id: snapshot.id,
      patient: { sex: patientSex, heightCm: patientHeightCm },
      mechanics: { complianceMlPerCmH2O: mechanics.complianceMlPerCmH2O, resistanceCmH2OPerLps: mechanics.resistanceCmH2OPerLps },
      effort: mechanics.patientEffort,
      gasExchange: {
        vco2MlPerMin: mechanics.vco2MlPerMin,
        deadSpaceMl: mechanics.deadSpaceMl,
        bicarbonateMmolPerL: mechanics.bicarbonateMmolPerL,
        hemoglobinGPerDl: mechanics.hemoglobinGPerDl,
        arteriovenousO2DifferenceMlPerDl: mechanics.arteriovenousO2DifferenceMlPerDl,
        initialPaco2MmHg: initialState.paco2MmHg,
        initialPao2MmHg: initialState.pao2MmHg,
        paco2TimeConstantMin: mechanics.gasTimeConstants.paco2TimeConstantMin,
        oxygenTimeConstantS: mechanics.gasTimeConstants.oxygenTimeConstantS,
        shuntCurve: SimulationCaseMapper._shuntCurve(mechanics),
      },
      hemodynamics: mechanics.hemodynamics,
      deterioration: mechanics.deterioration,
      initialSettings: SimulationCaseMapper._initialSettings(initialVentilatorSettings),
      events: simulation.events.map((event: ClinicalCaseEvent): CaseEvent => ({ ...event })),
      targets: simulation.targets ?? {},
      ...(engineSupportsEvolution(engineVersion) ? { evolution: SimulationCaseMapper._evolution(mechanics) } : {}),
    };

    return {
      id: snapshot.id,
      status: snapshot.status,
      engineCase,
      summary: {
        title: snapshot.title,
        pathology: snapshot.pathology,
        difficulty: snapshot.difficulty,
        patient: { sex: patientSex, ageYears: snapshot.patientAge, heightCm: patientHeightCm, weightKg: snapshot.patientWeightKg },
      },
      defaultRubric: simulation.defaultRubric,
    };
  }

  /** The base case with the resolved overrides of an own patient; parts the base case lacks stay absent */
  public static withPatient(snapshot: ClinicalCaseSnapshot, overrides: PatientOverrides): ClinicalCaseSnapshot {
    const { mechanics, initialVentilatorSettings, initialState } = snapshot.simulation;

    return {
      ...snapshot,
      patientAge: overrides.patientAge,
      patientWeightKg: overrides.patientWeightKg,
      simulation: {
        ...snapshot.simulation,
        patientSex: overrides.patientSex,
        patientHeightCm: overrides.patientHeightCm,
        mechanics: mechanics && {
          ...mechanics,
          complianceMlPerCmH2O: overrides.complianceMlPerCmH2O,
          resistanceCmH2OPerLps: overrides.resistanceCmH2OPerLps,
          hemodynamics: { ...mechanics.hemodynamics, baselineMapMmHg: overrides.baselineMapMmHg ?? mechanics.hemodynamics.baselineMapMmHg },
        },
        initialVentilatorSettings: initialVentilatorSettings && { ...initialVentilatorSettings, respiratoryRateBpm: overrides.respiratoryRateBpm },
        initialState: initialState && { ...initialState, pao2MmHg: overrides.pao2MmHg },
      },
    };
  }

  private static _evolution(mechanics: ClinicalCaseMechanics): EvolutionProfile {
    const own: ClinicalCaseEvolution | undefined = mechanics.evolution;
    const baselineMapMmHg: number = mechanics.hemodynamics.baselineMapMmHg;
    const thresholds: Partial<EvolutionThresholds> = {
      hypotensionMapMmHg: Math.min(
        DEFAULT_EVOLUTION_THRESHOLDS.hypotensionMapMmHg,
        baselineMapMmHg - HYPOTENSION_MARGIN_BELOW_BASELINE_MMHG,
      ),
      criticalMapMmHg: Math.min(DEFAULT_EVOLUTION_THRESHOLDS.criticalMapMmHg, baselineMapMmHg - CRITICAL_MARGIN_BELOW_BASELINE_MMHG),
      ...(own?.thresholds ?? {}),
    };

    if (own !== undefined) {
      return { ...own, thresholds };
    }

    return {
      ...DERIVED_EVOLUTION_DEFAULTS,
      progressionRatePerMin: mechanics.deterioration.ratePerMin,
      recoveryRatePerMin: mechanics.deterioration.ratePerMin / 2,
      thresholds,
    };
  }

  private static _shuntCurve(mechanics: ClinicalCaseMechanics): ShuntCurvePoint[] {
    if (mechanics.recruitmentCurve.length === 0) {
      return [{ peepCmH2O: 0, shuntFraction: mechanics.basalShuntFraction }];
    }

    return mechanics.recruitmentCurve.map(
      (point: RecruitmentCurvePoint): ShuntCurvePoint => ({ peepCmH2O: point.peepCmH2O, shuntFraction: point.shuntFraction }),
    );
  }

  private static _initialSettings(settings: ClinicalCaseVentilatorSettings): Partial<VentilatorSettings> {
    const initial: Record<string, number | string> = {};

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "number" || typeof value === "string") {
        initial[key] = value;
      }
    }

    return initial;
  }
}
