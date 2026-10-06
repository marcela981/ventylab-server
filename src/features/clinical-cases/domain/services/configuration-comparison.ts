/*
 * Funcionalidad: Servicio de dominio de comparación de configuraciones
 * Descripción: Compara la configuración del ventilador del estudiante con la configuración experta usando rangos aceptables (o tolerancia del 10 %), prioridades ponderadas (CRITICO 3, IMPORTANTE 2, OPCIONAL 1) y clasificación de errores, y calcula el puntaje global de 0 a 100
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AcceptableRange,
  type ComparisonSummary,
  type ConfigurationComparison,
  type ErrorClassification,
  type ExpertConfigurationData,
  type ParameterComparison,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";

interface NumericParameterMapping {
  key: string;
  label: string;
  expert: number | undefined;
  user: number | undefined;
}

export function compareConfigurations(userConfig: VentilatorConfiguration, expertConfig: ExpertConfigurationData): ConfigurationComparison {
  const parameters: ParameterComparison[] = [];
  const criticalErrors: string[] = [];
  let totalScore: number = 0;
  let totalWeight: number = 0;

  const acceptableRanges: Record<string, AcceptableRange> = expertConfig.acceptableRanges || {};
  const parameterPriorities: Record<string, string> = expertConfig.parameterPriorities || {};

  const paramMappings: NumericParameterMapping[] = [
    { key: "tidalVolume", label: "Volumen Tidal (Vt)", expert: expertConfig.tidalVolume, user: userConfig.tidalVolume },
    { key: "respiratoryRate", label: "Frecuencia Respiratoria (FR)", expert: expertConfig.respiratoryRate, user: userConfig.respiratoryRate },
    { key: "peep", label: "PEEP", expert: expertConfig.peep, user: userConfig.peep },
    { key: "fio2", label: "FiO2", expert: expertConfig.fio2, user: userConfig.fio2 },
    { key: "maxPressure", label: "Presión Máxima", expert: expertConfig.maxPressure, user: userConfig.maxPressure },
  ];

  for (const param of paramMappings) {
    if (param.expert === undefined && param.user === undefined) {
      continue;
    }

    const comparison: ParameterComparison = compareParameter(
      param.key,
      param.user,
      param.expert,
      acceptableRanges[param.key],
      parameterPriorities[param.key] || "OPCIONAL",
    );

    parameters.push(comparison);

    const weight: number = getParameterWeight(comparison.priority);
    const paramScore: number = calculateParameterScore(comparison);

    totalScore += paramScore * weight;
    totalWeight += weight;

    if (comparison.errorClassification === "critico") {
      criticalErrors.push(param.label);
    }
  }

  if (userConfig.ventilationMode && expertConfig.ventilationMode) {
    const modeMatch: boolean = userConfig.ventilationMode.toLowerCase() === expertConfig.ventilationMode.toLowerCase();
    const modeComparison: ParameterComparison = {
      parameter: "ventilationMode",
      userValue: userConfig.ventilationMode,
      expertValue: expertConfig.ventilationMode,
      difference: null,
      differencePercent: null,
      withinRange: modeMatch,
      errorClassification: modeMatch ? "correcto" : "critico",
      priority: parameterPriorities["ventilationMode"] || "CRITICO",
    };

    parameters.push(modeComparison);

    if (!modeMatch) {
      criticalErrors.push("Modo de Ventilación");
    }

    const weight: number = getParameterWeight(modeComparison.priority);
    const paramScore: number = modeMatch ? 100 : 0;

    totalScore += paramScore * weight;
    totalWeight += weight;
  }

  if (userConfig.iERatio && expertConfig.iERatio) {
    const ratioMatch: boolean = normalizeIERatio(userConfig.iERatio) === normalizeIERatio(expertConfig.iERatio);
    const ratioComparison: ParameterComparison = {
      parameter: "iERatio",
      userValue: userConfig.iERatio,
      expertValue: expertConfig.iERatio,
      difference: null,
      differencePercent: null,
      withinRange: ratioMatch,
      errorClassification: ratioMatch ? "correcto" : "moderado",
      priority: parameterPriorities["iERatio"] || "IMPORTANTE",
    };

    parameters.push(ratioComparison);

    const weight: number = getParameterWeight(ratioComparison.priority);
    const paramScore: number = ratioMatch ? 100 : 70;

    totalScore += paramScore * weight;
    totalWeight += weight;
  }

  const finalScore: number = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) / 100 : 0;

  const summary: ComparisonSummary = {
    correct: parameters.filter((p: ParameterComparison) => p.errorClassification === "correcto").length,
    minor: parameters.filter((p: ParameterComparison) => p.errorClassification === "menor").length,
    moderate: parameters.filter((p: ParameterComparison) => p.errorClassification === "moderado").length,
    critical: parameters.filter((p: ParameterComparison) => p.errorClassification === "critico").length,
  };

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    totalParameters: parameters.length,
    correctParameters: summary.correct,
    parameters,
    criticalErrors,
    summary,
  };
}

function compareParameter(
  key: string,
  userValue: number | undefined,
  expertValue: number | undefined,
  acceptableRange?: AcceptableRange,
  priority: string = "OPCIONAL",
): ParameterComparison {
  if (userValue === undefined && expertValue === undefined) {
    return {
      parameter: key,
      userValue: undefined,
      expertValue: undefined,
      difference: null,
      differencePercent: null,
      withinRange: true,
      errorClassification: "correcto",
      priority,
      acceptableRange,
    };
  }

  if (userValue === undefined || expertValue === undefined) {
    return {
      parameter: key,
      userValue,
      expertValue,
      difference: null,
      differencePercent: null,
      withinRange: false,
      errorClassification: priority === "CRITICO" ? "critico" : "moderado",
      priority,
      acceptableRange,
    };
  }

  const difference: number = userValue - expertValue;
  const differencePercent: number = expertValue !== 0 ? (difference / expertValue) * 100 : userValue !== 0 ? 100 : 0;

  let withinRange: boolean = true;

  if (acceptableRange) {
    withinRange = userValue >= acceptableRange.min && userValue <= acceptableRange.max;
  } else {
    const tolerance: number = Math.abs(expertValue * 0.1);

    withinRange = Math.abs(difference) <= tolerance;
  }

  let errorClassification: ErrorClassification = "correcto";

  if (!withinRange) {
    const absDifferencePercent: number = Math.abs(differencePercent);

    if (priority === "CRITICO") {
      errorClassification = absDifferencePercent > 20 ? "critico" : "moderado";
    } else if (priority === "IMPORTANTE") {
      errorClassification = absDifferencePercent > 30 ? "moderado" : "menor";
    } else {
      errorClassification = absDifferencePercent > 50 ? "moderado" : "menor";
    }
  } else if (Math.abs(differencePercent) > 5) {
    errorClassification = "menor";
  }

  return {
    parameter: key,
    userValue,
    expertValue,
    difference,
    differencePercent: Math.round(differencePercent * 100) / 100,
    withinRange,
    errorClassification,
    priority,
    acceptableRange,
  };
}

function normalizeIERatio(ratio: string): string {
  return ratio.replace(/\s/g, "").toLowerCase();
}

function getParameterWeight(priority: string): number {
  switch (priority.toUpperCase()) {
    case "CRITICO":
      return 3;
    case "IMPORTANTE":
      return 2;
    case "OPCIONAL":
      return 1;
    default:
      return 1;
  }
}

function calculateParameterScore(comparison: ParameterComparison): number {
  if (comparison.errorClassification === "correcto") {
    return 100;
  }

  if (comparison.withinRange) {
    const absDiffPercentInRange: number = Math.abs(comparison.differencePercent || 0);

    return Math.max(80, 100 - absDiffPercentInRange);
  }

  const absDiffPercent: number = Math.abs(comparison.differencePercent || 0);

  switch (comparison.errorClassification) {
    case "menor":
      return Math.max(60, 100 - absDiffPercent * 0.5);
    case "moderado":
      return Math.max(40, 100 - absDiffPercent);
    case "critico":
      return Math.max(0, 100 - absDiffPercent * 1.5);
    default:
      return 50;
  }
}
