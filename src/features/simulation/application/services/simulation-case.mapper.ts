/*
 * Funcionalidad: Mapeo de caso clínico a caso del motor
 * Descripción: Convierte la instantánea de un caso clínico entregada por ClinicalCasesFacade en el caso del motor fisiológico (paciente, mecánica, esfuerzo, intercambio gaseoso con la curva de reclutamiento o el shunt basal, hemodinamia, deterioro, ajustes iniciales, eventos y objetivos) y en el resumen sin datos personales que usa la asistencia; devuelve undefined si el perfil de simulación está incompleto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type ClinicalCaseEvent,
  type ClinicalCaseMechanics,
  type ClinicalCaseSimulationProfile,
  type ClinicalCaseSnapshot,
  type ClinicalCaseVentilatorSettings,
  type RecruitmentCurvePoint,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { type AssistCaseSummary } from "@/features/simulation/domain/assist/assist-snapshot";
import {
  type CaseEvent,
  type EngineCase,
  type ShuntCurvePoint,
  type VentilatorSettings,
} from "@/features/simulation/domain/engine";

export interface SimulationCaseDefinition {
  readonly id: string;
  readonly status: string;
  readonly engineCase: EngineCase;
  readonly summary: AssistCaseSummary;
  readonly defaultRubric?: unknown;
}

export class SimulationCaseMapper {
  public static toDefinition(snapshot: ClinicalCaseSnapshot): SimulationCaseDefinition | undefined {
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
