/*
 * Funcionalidad: Proveedor de puntaje práctico por comparación clínica
 * Descripción: Implementa IPracticalScoreProvider tomando el último comando del registro de parámetros de una sesión del simulador, convirtiéndolo a la configuración del estudiante y comparándolo con la configuración experta derivada de la rúbrica mediante compareConfigurations de casos clínicos; devuelve el puntaje como fracción de 0 a 1 o "no disponible"
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import {
  type AcceptableRange,
  type ConfigurationComparison,
  type ExpertConfigurationData,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import { compareConfigurations } from "@/features/clinical-cases/domain/services/configuration-comparison";
import {
  EMPTY_PARAMETERS_LOG_REASON,
  INVALID_LAST_COMMAND_REASON,
  INVALID_RUBRIC_REASON,
  type IPracticalScoreProvider,
  type PracticalScoreResult,
  SESSION_NOT_FOUND_REASON,
} from "@/features/evaluation/application/ports/practical-score-provider.interface";
import {
  DEFAULT_SIMULATION_RUBRIC_PRIORITY,
  type SimulationRubric,
  type SimulationRubricCriterion,
  type SimulationRubricParameter,
  type SimulationRubricValidation,
  validateSimulationRubric,
} from "@/features/evaluation/domain/value-objects/simulation-rubric";
import {
  type ISimulatorSessionReader,
  SIMULATOR_SESSION_READER_TOKEN,
} from "@/features/evaluation/infrastructure/persistence/prisma/simulator-session-reader";

const RUBRIC_EXPERT_CONFIGURATION_ID: string = "evaluation-rubric";
const FRACTION_FIO2_UPPER_BOUND: number = 1;

type NumericConfigurationKey = "tidalVolume" | "respiratoryRate" | "peep" | "fio2" | "maxPressure";

const COMMAND_NUMERIC_FIELDS: Record<NumericConfigurationKey, string> = {
  tidalVolume: "tidalVolume",
  respiratoryRate: "respiratoryRate",
  peep: "peep",
  fio2: "fio2",
  maxPressure: "pressureLimit",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalNumber(command: Record<string, unknown>, field: string): number | undefined | null {
  const value: unknown = command[field];

  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// The simulator stores FiO2 as a fraction (0.21-1.0) while clinical-case configurations use percent.
function toPercentFio2(value: number): number {
  return value <= FRACTION_FIO2_UPPER_BOUND ? Math.round(value * 10000) / 100 : value;
}

function toUserConfiguration(command: unknown, gradedParameters: Set<SimulationRubricParameter>): VentilatorConfiguration | undefined {
  if (!isRecord(command)) {
    return undefined;
  }

  const gradesMode: boolean = gradedParameters.has("ventilationMode");

  if (gradesMode && (typeof command.mode !== "string" || command.mode.trim() === "")) {
    return undefined;
  }

  const configuration: VentilatorConfiguration = { ventilationMode: gradesMode ? String(command.mode) : "" };

  for (const [key, field] of Object.entries(COMMAND_NUMERIC_FIELDS) as [NumericConfigurationKey, string][]) {
    const value: number | undefined | null = optionalNumber(command, field);

    if (value === null) {
      return undefined;
    }

    if (value !== undefined && gradedParameters.has(key)) {
      configuration[key] = key === "fio2" ? toPercentFio2(value) : value;
    }
  }

  if (gradedParameters.has("iERatio") && typeof command.ieRatio === "string") {
    configuration.iERatio = command.ieRatio;
  }

  return configuration;
}

function toExpertConfiguration(rubric: SimulationRubric): ExpertConfigurationData {
  const expert: ExpertConfigurationData = {
    id: RUBRIC_EXPERT_CONFIGURATION_ID,
    ventilationMode: "",
    justification: rubric.justification ?? "",
  };
  const acceptableRanges: Record<string, AcceptableRange> = {};
  const parameterPriorities: Record<string, string> = {};

  rubric.criteria.forEach((criterion: SimulationRubricCriterion) => {
    parameterPriorities[criterion.parameter] = criterion.priority ?? DEFAULT_SIMULATION_RUBRIC_PRIORITY;

    if (criterion.min !== undefined && criterion.max !== undefined) {
      acceptableRanges[criterion.parameter] = { min: criterion.min, max: criterion.max };
    }

    if (criterion.parameter === "ventilationMode" || criterion.parameter === "iERatio") {
      expert[criterion.parameter] = String(criterion.expectedValue);
    } else {
      expert[criterion.parameter] = Number(criterion.expectedValue);
    }
  });

  return { ...expert, acceptableRanges, parameterPriorities };
}

@Injectable()
export class ClinicalComparisonPracticalScoreProvider implements IPracticalScoreProvider {
  public constructor(
    @Inject(SIMULATOR_SESSION_READER_TOKEN)
    private readonly _sessionReader: ISimulatorSessionReader,
  ) {}

  public async getSessionScore(sessionId: string, rubric: unknown): Promise<PracticalScoreResult> {
    const validation: SimulationRubricValidation = validateSimulationRubric(rubric);

    if (!validation.valid || !validation.rubric) {
      return { available: false, reason: INVALID_RUBRIC_REASON };
    }

    const parametersLog: unknown[] | undefined = await this._sessionReader.getParametersLog(sessionId);

    if (!parametersLog) {
      return { available: false, reason: SESSION_NOT_FOUND_REASON };
    }

    if (parametersLog.length === 0) {
      return { available: false, reason: EMPTY_PARAMETERS_LOG_REASON };
    }

    const gradedParameters: Set<SimulationRubricParameter> = new Set<SimulationRubricParameter>(
      validation.rubric.criteria.map((criterion: SimulationRubricCriterion) => criterion.parameter),
    );
    const userConfiguration: VentilatorConfiguration | undefined = toUserConfiguration(parametersLog[parametersLog.length - 1], gradedParameters);

    if (!userConfiguration) {
      return { available: false, reason: INVALID_LAST_COMMAND_REASON };
    }

    const comparison: ConfigurationComparison = compareConfigurations(userConfiguration, toExpertConfiguration(validation.rubric));

    return { available: true, score: Math.round(comparison.score * 100) / 10000, breakdown: comparison.parameters };
  }
}
