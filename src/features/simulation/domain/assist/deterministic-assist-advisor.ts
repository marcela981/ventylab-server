/*
 * Funcionalidad: Asesor determinista de la simulación
 * Descripción: Alternativa basada en reglas al asistente de IA: a partir del estado de la sesión detecta presión meseta y de distensión elevadas, auto-PEEP, hipoxemia, hipercapnia o acidosis, hipocapnia, volumen corriente alto o bajo por kg de peso predicho, alarma de presión alta, desconexión y apnea en PSV/CPAP, y redacta en español o inglés qué va bien, qué conviene revisar, qué variable mirar y por qué, sin dictar valores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Alarm, AlarmCode, CycleMetrics, GasExchangeSnapshot, TargetId, TargetStatus, VentilatorSettings } from "../engine";

import { AssistSnapshotInput } from "./assist-snapshot";

export type AssistLanguage = "es" | "en";

export type AssistFindingCode =
  | "DISCONNECTION"
  | "APNEA_SPONTANEOUS_MODE"
  | "HIGH_PRESSURE_ALARM"
  | "HIGH_PLATEAU_PRESSURE"
  | "HIGH_DRIVING_PRESSURE"
  | "HIGH_TIDAL_VOLUME_PER_KG"
  | "LOW_TIDAL_VOLUME"
  | "AUTO_PEEP"
  | "LOW_SPO2"
  | "HYPERCAPNIA_OR_ACIDOSIS"
  | "HYPOCAPNIA";

export interface AssistFinding {
  readonly code: AssistFindingCode;
  readonly value: number;
  readonly limit: number;
}

export const PLATEAU_PRESSURE_LIMIT_CMH2O: number = 30;
export const DRIVING_PRESSURE_LIMIT_CMH2O: number = 15;
export const TIDAL_VOLUME_PER_KG_LIMIT: number = 8;
export const AUTO_PEEP_SIGNIFICANT_CMH2O: number = 2;

const DEFAULT_SPO2_MIN_PERCENT: number = 90;
const DEFAULT_PACO2_RANGE: { readonly min: number; readonly max: number } = { min: 35, max: 45 };
const DEFAULT_PH_MIN: number = 7.35;

interface TextSet {
  readonly heading: string;
  readonly noCycle: string;
  readonly wellHeading: string;
  readonly reviewHeading: string;
  readonly allGood: string;
  readonly closing: string;
  readonly wellTarget: (target: TargetStatus) => string;
  readonly wellPlateau: (value: number) => string;
  readonly wellDriving: (value: number) => string;
  readonly finding: (finding: AssistFinding, settings: VentilatorSettings) => string;
}

const TARGET_NAMES: Record<AssistLanguage, Record<TargetId, string>> = {
  es: {
    SPO2: "SpO2",
    PACO2: "PaCO2",
    PH: "pH",
    PLATEAU_PRESSURE: "presión meseta",
    DRIVING_PRESSURE: "presión de distensión",
    TIDAL_VOLUME_PER_KG_PBW: "volumen corriente por kg de peso predicho",
    AUTO_PEEP: "auto-PEEP",
  },
  en: {
    SPO2: "SpO2",
    PACO2: "PaCO2",
    PH: "pH",
    PLATEAU_PRESSURE: "plateau pressure",
    DRIVING_PRESSURE: "driving pressure",
    TIDAL_VOLUME_PER_KG_PBW: "tidal volume per kg of predicted body weight",
    AUTO_PEEP: "auto-PEEP",
  },
};

function isVolumeControlled(settings: VentilatorSettings): boolean {
  return settings.mode === "VCV" || (settings.mode === "SIMV" && settings.simvMandatoryType === "VCV");
}

function format(value: number): string {
  return String(Math.round(value * 100) / 100);
}

const SPANISH_TEXTS: TextSet = {
  heading: "Orientación automática (sin modelo de lenguaje):",
  noCycle: "Todavía no hay un ciclo respiratorio completo; espera unos segundos para interpretar las mediciones.",
  wellHeading: "Lo que va bien:",
  reviewHeading: "Lo que conviene revisar:",
  allGood: "No se detectan problemas con las reglas de seguridad y los objetivos del caso. Observa cómo responde el paciente antes de hacer nuevos cambios.",
  closing: "Modifica un parámetro a la vez y observa su efecto en las curvas y en los gases antes del siguiente cambio.",
  wellTarget: (target: TargetStatus): string => `${TARGET_NAMES.es[target.id]} dentro del objetivo del caso (${format(target.value ?? 0)}).`,
  wellPlateau: (value: number): string => `Presión meseta de ${format(value)} cmH2O, por debajo del límite de protección pulmonar de 30 cmH2O.`,
  wellDriving: (value: number): string => `Presión de distensión de ${format(value)} cmH2O, por debajo de 15 cmH2O.`,
  finding: (finding: AssistFinding, settings: VentilatorSettings): string => {
    const value: string = format(finding.value);
    const limit: string = format(finding.limit);

    switch (finding.code) {
      case "DISCONNECTION":
        return "El circuito está desconectado: no llega ventilación al paciente. Revisa la conexión del circuito antes de interpretar cualquier otro valor.";
      case "APNEA_SPONTANEOUS_MODE":
        return `Alarma de apnea en ${settings.mode}: en este modo cada respiración depende del esfuerzo del paciente y no hay frecuencia de respaldo suficiente. Revisa si el modo es adecuado para el esfuerzo actual y el tiempo de apnea configurado.`;
      case "HIGH_PRESSURE_ALARM":
        return `Alarma de presión alta (pico de ${value} cmH2O, límite ${limit}). Una presión pico alta con meseta normal sugiere aumento de resistencia (broncoespasmo, secreciones); con meseta alta sugiere baja distensibilidad o volumen excesivo. Compara pico y meseta para decidir qué revisar.`;
      case "HIGH_PLATEAU_PRESSURE":
        return `Presión meseta de ${value} cmH2O, por encima de ${limit}. La meseta refleja la presión alveolar y valores altos aumentan el riesgo de barotrauma; la estrategia protectora (ARDSNet) la mantiene en 30 cmH2O o menos. Revisa el volumen corriente.`;
      case "HIGH_DRIVING_PRESSURE":
        return `Presión de distensión de ${value} cmH2O, por encima de ${limit}. Indica cuánto se estira el pulmón en cada ciclo en relación con su distensibilidad y se asocia a mayor mortalidad. Revisa el volumen corriente y si la PEEP actual recluta o sobredistiende.`;
      case "HIGH_TIDAL_VOLUME_PER_KG":
        return `Volumen corriente de ${value} mL/kg de peso predicho, por encima de ${limit}. La ventilación protectora usa 6–8 mL/kg de peso predicho (calculado con talla y sexo, no con el peso real) para limitar el volutrauma. Revisa el volumen corriente o la presión inspiratoria.`;
      case "LOW_TIDAL_VOLUME":
        return `Volumen corriente bajo (${value} mL/kg de peso predicho). Puede deberse a presión inspiratoria o soporte insuficientes, a fuga o a un aumento de resistencia o pérdida de distensibilidad. Revisa la presión entregada y la mecánica del paciente, y vigila la PaCO2.`;
      case "AUTO_PEEP":
        return isVolumeControlled(settings)
          ? `Auto-PEEP de ${value} cmH2O: el pulmón no termina de vaciarse antes del siguiente ciclo (atrapamiento aéreo). Revisa el tiempo espiratorio disponible: la frecuencia respiratoria, la relación I:E y el flujo inspiratorio, porque un flujo mayor acorta la inspiración y alarga la espiración.`
          : `Auto-PEEP de ${value} cmH2O: el pulmón no termina de vaciarse antes del siguiente ciclo (atrapamiento aéreo). Revisa el tiempo espiratorio disponible: la frecuencia respiratoria, el tiempo inspiratorio y la relación I:E.`;
      case "LOW_SPO2":
        return `SpO2 de ${value} %, por debajo del objetivo (${limit} %). La oxigenación depende sobre todo de la FiO2 y de la presión media de la vía aérea; si hay colapso alveolar (shunt), la PEEP y el reclutamiento mejoran la oxigenación más que la FiO2 sola. Revisa FiO2 y PEEP.`;
      case "HYPERCAPNIA_OR_ACIDOSIS":
        return `PaCO2 elevada o pH bajo (${value}, límite ${limit}): la ventilación alveolar es insuficiente para eliminar el CO2. La ventilación alveolar depende de la frecuencia, del volumen corriente y del espacio muerto. Revisa frecuencia y volumen corriente sin superar los límites de presión.`;
      case "HYPOCAPNIA":
        return `PaCO2 de ${value} mmHg, por debajo de ${limit}: hay sobreventilación, que produce alcalosis respiratoria y vasoconstricción cerebral. Revisa la frecuencia respiratoria y el volumen minuto.`;
    }
  },
};

const ENGLISH_TEXTS: TextSet = {
  heading: "Automatic guidance (no language model):",
  noCycle: "There is no complete breath yet; wait a few seconds before interpreting the measurements.",
  wellHeading: "What is going well:",
  reviewHeading: "What to review:",
  allGood: "No problems are detected by the safety rules and the case targets. Watch how the patient responds before making new changes.",
  closing: "Change one parameter at a time and watch its effect on the waveforms and gases before the next change.",
  wellTarget: (target: TargetStatus): string => `${TARGET_NAMES.en[target.id]} within the case target (${format(target.value ?? 0)}).`,
  wellPlateau: (value: number): string => `Plateau pressure of ${format(value)} cmH2O, below the lung-protective limit of 30 cmH2O.`,
  wellDriving: (value: number): string => `Driving pressure of ${format(value)} cmH2O, below 15 cmH2O.`,
  finding: (finding: AssistFinding, settings: VentilatorSettings): string => {
    const value: string = format(finding.value);
    const limit: string = format(finding.limit);

    switch (finding.code) {
      case "DISCONNECTION":
        return "The circuit is disconnected: no ventilation reaches the patient. Check the circuit connection before interpreting any other value.";
      case "APNEA_SPONTANEOUS_MODE":
        return `Apnea alarm in ${settings.mode}: in this mode every breath depends on the patient's effort and there is no adequate backup rate. Review whether the mode fits the current effort and the configured apnea time.`;
      case "HIGH_PRESSURE_ALARM":
        return `High pressure alarm (peak ${value} cmH2O, limit ${limit}). A high peak with a normal plateau suggests increased resistance (bronchospasm, secretions); with a high plateau it suggests low compliance or excessive volume. Compare peak and plateau to decide what to review.`;
      case "HIGH_PLATEAU_PRESSURE":
        return `Plateau pressure of ${value} cmH2O, above ${limit}. Plateau reflects alveolar pressure and high values raise the risk of barotrauma; the lung-protective strategy (ARDSNet) keeps it at 30 cmH2O or less. Review the tidal volume.`;
      case "HIGH_DRIVING_PRESSURE":
        return `Driving pressure of ${value} cmH2O, above ${limit}. It shows how much the lung is stretched each breath relative to its compliance and is associated with higher mortality. Review the tidal volume and whether the current PEEP recruits or overdistends.`;
      case "HIGH_TIDAL_VOLUME_PER_KG":
        return `Tidal volume of ${value} mL/kg of predicted body weight, above ${limit}. Protective ventilation uses 6–8 mL/kg of predicted body weight (from height and sex, not actual weight) to limit volutrauma. Review the tidal volume or the inspiratory pressure.`;
      case "LOW_TIDAL_VOLUME":
        return `Low tidal volume (${value} mL/kg of predicted body weight). It may come from insufficient inspiratory pressure or support, a leak, or increased resistance or lost compliance. Review the delivered pressure and the patient's mechanics, and watch PaCO2.`;
      case "AUTO_PEEP":
        return isVolumeControlled(settings)
          ? `Auto-PEEP of ${value} cmH2O: the lung does not finish emptying before the next breath (air trapping). Review the available expiratory time: respiratory rate, I:E ratio and inspiratory flow, because a higher flow shortens inspiration and lengthens expiration.`
          : `Auto-PEEP of ${value} cmH2O: the lung does not finish emptying before the next breath (air trapping). Review the available expiratory time: respiratory rate, inspiratory time and I:E ratio.`;
      case "LOW_SPO2":
        return `SpO2 of ${value} %, below the target (${limit} %). Oxygenation depends mainly on FiO2 and mean airway pressure; with alveolar collapse (shunt), PEEP and recruitment improve oxygenation more than FiO2 alone. Review FiO2 and PEEP.`;
      case "HYPERCAPNIA_OR_ACIDOSIS":
        return `High PaCO2 or low pH (${value}, limit ${limit}): alveolar ventilation is not enough to clear CO2. Alveolar ventilation depends on rate, tidal volume and dead space. Review rate and tidal volume without exceeding the pressure limits.`;
      case "HYPOCAPNIA":
        return `PaCO2 of ${value} mmHg, below ${limit}: the patient is over-ventilated, which causes respiratory alkalosis and cerebral vasoconstriction. Review the respiratory rate and the minute volume.`;
    }
  },
};

const TEXTS: Record<AssistLanguage, TextSet> = { es: SPANISH_TEXTS, en: ENGLISH_TEXTS };

export function detectAssistFindings(input: AssistSnapshotInput): AssistFinding[] {
  const findings: AssistFinding[] = [];
  const cycle: CycleMetrics | null = input.metrics.lastCycle;
  const gas: GasExchangeSnapshot = input.metrics.gasExchange;
  const disconnection: Alarm | undefined = findAlarm(input.alarms, "DISCONNECTION");
  const apnea: Alarm | undefined = findAlarm(input.alarms, "APNEA");
  const highPressure: Alarm | undefined = findAlarm(input.alarms, "HIGH_PRESSURE");
  const lowVolume: Alarm | undefined = findAlarm(input.alarms, "LOW_TIDAL_VOLUME");
  const autoPeepAlarm: Alarm | undefined = findAlarm(input.alarms, "AUTO_PEEP");

  if (disconnection !== undefined) {
    findings.push({ code: "DISCONNECTION", value: disconnection.value, limit: disconnection.threshold });
  }

  if (apnea !== undefined && (input.settings.mode === "PSV" || input.settings.mode === "CPAP")) {
    findings.push({ code: "APNEA_SPONTANEOUS_MODE", value: apnea.value, limit: apnea.threshold });
  }

  if (highPressure !== undefined) {
    findings.push({ code: "HIGH_PRESSURE_ALARM", value: highPressure.value, limit: highPressure.threshold });
  }

  if (cycle !== null) {
    const plateauLimit: number = Math.min(PLATEAU_PRESSURE_LIMIT_CMH2O, targetMax(input.targets, "PLATEAU_PRESSURE") ?? PLATEAU_PRESSURE_LIMIT_CMH2O);
    const drivingLimit: number = Math.min(DRIVING_PRESSURE_LIMIT_CMH2O, targetMax(input.targets, "DRIVING_PRESSURE") ?? DRIVING_PRESSURE_LIMIT_CMH2O);
    const volumeLimit: number = Math.min(TIDAL_VOLUME_PER_KG_LIMIT, targetMax(input.targets, "TIDAL_VOLUME_PER_KG_PBW") ?? TIDAL_VOLUME_PER_KG_LIMIT);
    const autoPeepLimit: number = targetMax(input.targets, "AUTO_PEEP") ?? AUTO_PEEP_SIGNIFICANT_CMH2O;

    if (cycle.plateauPressureCmH2O > plateauLimit) {
      findings.push({ code: "HIGH_PLATEAU_PRESSURE", value: cycle.plateauPressureCmH2O, limit: plateauLimit });
    }

    if (cycle.drivingPressureCmH2O > drivingLimit) {
      findings.push({ code: "HIGH_DRIVING_PRESSURE", value: cycle.drivingPressureCmH2O, limit: drivingLimit });
    }

    if (cycle.tidalVolumePerKgPbw > volumeLimit) {
      findings.push({ code: "HIGH_TIDAL_VOLUME_PER_KG", value: cycle.tidalVolumePerKgPbw, limit: volumeLimit });
    }

    if (lowVolume !== undefined) {
      findings.push({ code: "LOW_TIDAL_VOLUME", value: cycle.tidalVolumePerKgPbw, limit: lowVolume.threshold });
    }

    if (cycle.autoPeepCmH2O > autoPeepLimit || autoPeepAlarm !== undefined) {
      findings.push({ code: "AUTO_PEEP", value: cycle.autoPeepCmH2O, limit: autoPeepLimit });
    }
  }

  const spo2Min: number = targetMin(input.targets, "SPO2") ?? DEFAULT_SPO2_MIN_PERCENT;

  if (gas.spo2Percent < spo2Min) {
    findings.push({ code: "LOW_SPO2", value: gas.spo2Percent, limit: spo2Min });
  }

  const paco2Max: number = targetMax(input.targets, "PACO2") ?? DEFAULT_PACO2_RANGE.max;
  const paco2Min: number = targetMin(input.targets, "PACO2") ?? DEFAULT_PACO2_RANGE.min;
  const phMin: number = targetMin(input.targets, "PH") ?? DEFAULT_PH_MIN;

  if (gas.paco2MmHg > paco2Max) {
    findings.push({ code: "HYPERCAPNIA_OR_ACIDOSIS", value: gas.paco2MmHg, limit: paco2Max });
  } else if (gas.ph < phMin) {
    findings.push({ code: "HYPERCAPNIA_OR_ACIDOSIS", value: gas.ph, limit: phMin });
  } else if (gas.paco2MmHg < paco2Min) {
    findings.push({ code: "HYPOCAPNIA", value: gas.paco2MmHg, limit: paco2Min });
  }

  return findings;
}

export function adviseDeterministically(input: AssistSnapshotInput, language: AssistLanguage): string {
  const texts: TextSet = TEXTS[language];
  const findings: AssistFinding[] = detectAssistFindings(input);
  const cycle: CycleMetrics | null = input.metrics.lastCycle;
  const wellLines: string[] = input.targets
    .filter((target: TargetStatus): boolean => target.status === "MET")
    .map((target: TargetStatus): string => texts.wellTarget(target));
  const findingCodes: Set<AssistFindingCode> = new Set(findings.map((finding: AssistFinding): AssistFindingCode => finding.code));

  if (cycle !== null && !hasMetTarget(input.targets, "PLATEAU_PRESSURE") && !findingCodes.has("HIGH_PLATEAU_PRESSURE")) {
    wellLines.push(texts.wellPlateau(cycle.plateauPressureCmH2O));
  }

  if (cycle !== null && !hasMetTarget(input.targets, "DRIVING_PRESSURE") && !findingCodes.has("HIGH_DRIVING_PRESSURE")) {
    wellLines.push(texts.wellDriving(cycle.drivingPressureCmH2O));
  }

  const lines: string[] = [texts.heading];

  if (cycle === null) {
    lines.push(texts.noCycle);
  }

  if (wellLines.length > 0) {
    lines.push("", texts.wellHeading, ...wellLines.map((line: string): string => `- ${line}`));
  }

  if (findings.length === 0) {
    lines.push("", texts.allGood);
  } else {
    lines.push("", texts.reviewHeading, ...findings.map((finding: AssistFinding): string => `- ${texts.finding(finding, input.settings)}`));
  }

  lines.push("", texts.closing);

  return lines.join("\n");
}

function findAlarm(alarms: readonly Alarm[], code: AlarmCode): Alarm | undefined {
  return alarms.find((alarm: Alarm): boolean => alarm.code === code);
}

function findTarget(targets: readonly TargetStatus[], id: TargetId): TargetStatus | undefined {
  return targets.find((target: TargetStatus): boolean => target.id === id);
}

function targetMax(targets: readonly TargetStatus[], id: TargetId): number | undefined {
  return findTarget(targets, id)?.max ?? undefined;
}

function targetMin(targets: readonly TargetStatus[], id: TargetId): number | undefined {
  return findTarget(targets, id)?.min ?? undefined;
}

function hasMetTarget(targets: readonly TargetStatus[], id: TargetId): boolean {
  return findTarget(targets, id)?.status === "MET";
}
