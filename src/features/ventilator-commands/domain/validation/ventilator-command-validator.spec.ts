/*
 * Funcionalidad: Pruebas del validador de comandos del ventilador
 * Descripción: Verifica el rechazo de cargas no numéricas, NaN, infinitos y cadenas, los parámetros obligatorios por modo, los rangos compartidos, la coherencia entre frecuencia, tiempo inspiratorio, relación I:E, presión límite y PEEP, y los límites de seguridad más estrictos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { VENTILATOR_PARAMETER_LIMITS } from "@/common/domain/ventilator/ventilator-limits";
import {
  clampSafetyLimits,
  DEFAULT_VENTILATOR_SAFETY_LIMITS,
  type VentilatorCommandSafetyLimits,
} from "@/features/ventilator-commands/domain/validation/ventilator-command-safety-limits";
import {
  parseIeRatio,
  validateVentilatorCommand,
  type VentilatorCommandValidation,
  type VentilatorCommandViolation,
} from "@/features/ventilator-commands/domain/validation/ventilator-command-validator";

const SAFETY: VentilatorCommandSafetyLimits = DEFAULT_VENTILATOR_SAFETY_LIMITS;

const VALID_VCV: Record<string, unknown> = { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 };
const VALID_PCV: Record<string, unknown> = { mode: "PCV", pressureLimit: 25, respiratoryRate: 15, peep: 5, fio2: 0.4, inspiratoryTime: 1 };

function violationsOf(validation: VentilatorCommandValidation): VentilatorCommandViolation[] {
  return validation.valid ? [] : [...validation.violations];
}

function rulesOf(validation: VentilatorCommandValidation): string[] {
  return violationsOf(validation).map((violation: VentilatorCommandViolation): string => `${violation.field}:${violation.rule}`);
}

describe("validateVentilatorCommand", () => {
  it("accepts a complete VCV command and keeps only the known fields", () => {
    const input: Record<string, unknown> = { ...VALID_VCV, timestamp: 123, extra: "ignored" };

    const validation: VentilatorCommandValidation = validateVentilatorCommand(input, SAFETY);

    expect(validation).toEqual({ valid: true, command: { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 } });
  });

  it("accepts a complete PCV command", () => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand(VALID_PCV, SAFETY);

    expect(validation.valid).toBe(true);
  });

  it.each([null, undefined, "VCV", 42, [VALID_VCV]])("rejects a payload that is not an object (%p)", (input: unknown) => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand(input, SAFETY);

    expect(rulesOf(validation)).toEqual(["command:invalid_payload"]);
  });

  it("rejects an unknown or lowercase mode", () => {
    const rules: string[][] = ["CPAP", "vcv", 1, undefined].map((mode: unknown): string[] => rulesOf(validateVentilatorCommand({ ...VALID_VCV, mode }, SAFETY)));

    expect(rules).toEqual([["mode:invalid_mode"], ["mode:invalid_mode"], ["mode:invalid_mode"], ["mode:invalid_mode"]]);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, "450", true, {}])("rejects a non-finite or non-numeric tidal volume (%p)", (tidalVolume: unknown) => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_VCV, tidalVolume }, SAFETY);

    expect(rulesOf(validation)).toEqual(["tidalVolume:not_a_number"]);
  });

  it("requires the parameters of each mode", () => {
    const vcv: string[] = rulesOf(validateVentilatorCommand({ mode: "VCV" }, SAFETY));
    const pcv: string[] = rulesOf(validateVentilatorCommand({ mode: "PCV" }, SAFETY));
    const simv: string[] = rulesOf(validateVentilatorCommand({ mode: "SIMV" }, SAFETY));
    const psv: string[] = rulesOf(validateVentilatorCommand({ mode: "PSV" }, SAFETY));

    expect(vcv).toEqual(["tidalVolume:required", "respiratoryRate:required", "peep:required", "fio2:required"]);
    expect(pcv).toEqual(["pressureLimit:required", "respiratoryRate:required", "peep:required", "fio2:required", "inspiratoryTime:required"]);
    expect(simv).toEqual(["tidalVolume:required", "respiratoryRate:required", "peep:required", "fio2:required"]);
    expect(psv).toEqual(["pressureLimit:required", "peep:required", "fio2:required"]);
  });

  it("rejects values outside the shared limits", () => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand(
      { ...VALID_VCV, tidalVolume: 100, respiratoryRate: 60, fio2: 0.1, flowRate: 500, sensitivity: 50 },
      SAFETY,
    );

    expect(rulesOf(validation)).toEqual(["tidalVolume:out_of_range", "respiratoryRate:out_of_range", "fio2:out_of_range", "flowRate:out_of_range", "sensitivity:out_of_range"]);
    expect(violationsOf(validation)[0].limit).toEqual({ min: VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl.min, max: VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl.max });
  });

  it("rejects a too short expiratory time", () => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_PCV, respiratoryRate: 40, inspiratoryTime: 1.4 }, SAFETY);

    expect(rulesOf(validation)).toContain("inspiratoryTime:expiratory_time_too_short");
  });

  it("rejects an I:E ratio inconsistent with the rate and inspiratory time", () => {
    const consistent: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_PCV, ieRatio: "1:3" }, SAFETY);
    const inconsistent: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_PCV, ieRatio: 0.5 }, SAFETY);

    expect(consistent.valid).toBe(true);
    expect(rulesOf(inconsistent)).toEqual(["ieRatio:ie_ratio_inconsistent"]);
  });

  it("rejects an inverse I:E ratio, given or derived, when the safety maximum is 1", () => {
    const given: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_VCV, ieRatio: "2:1" }, SAFETY);
    const derived: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_PCV, respiratoryRate: 20, inspiratoryTime: 2 }, SAFETY);

    expect(rulesOf(given)).toEqual(["ieRatio:safety_limit"]);
    expect(rulesOf(derived)).toEqual(["ieRatio:safety_limit"]);
  });

  it("rejects a pressure limit that is not above PEEP", () => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand({ ...VALID_PCV, pressureLimit: 12, peep: 12 }, SAFETY);

    expect(rulesOf(validation)).toEqual(["pressureLimit:pressure_limit_not_above_peep"]);
  });

  it("applies the stricter safety limits inside the shared ranges", () => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand(
      { mode: "PCV", pressureLimit: 45, respiratoryRate: 38, peep: 18, fio2: 0.4, inspiratoryTime: 0.5, tidalVolume: 750 },
      SAFETY,
    );

    expect(rulesOf(validation)).toEqual(["tidalVolume:safety_limit", "respiratoryRate:safety_limit", "peep:safety_limit", "pressureLimit:safety_limit"]);
  });

  it("reports several violations at once", () => {
    const validation: VentilatorCommandValidation = validateVentilatorCommand({ mode: "VCV", tidalVolume: Number.NaN, respiratoryRate: "14", peep: 5 }, SAFETY);

    expect(rulesOf(validation)).toEqual(["tidalVolume:not_a_number", "respiratoryRate:not_a_number", "fio2:required"]);
  });
});

describe("parseIeRatio", () => {
  it("parses numbers and a:b strings", () => {
    const values: number[] = [parseIeRatio(0.5), parseIeRatio("1:2"), parseIeRatio(" 2 : 1 "), parseIeRatio("1:0"), parseIeRatio("abc"), parseIeRatio(true)];

    expect(values.slice(0, 3)).toEqual([0.5, 0.5, 2]);
    expect(values.slice(3).every((value: number): boolean => Number.isNaN(value))).toBe(true);
  });
});

describe("clampSafetyLimits", () => {
  it("never lets a safety limit be looser than the shared limits", () => {
    const clamped: VentilatorCommandSafetyLimits = clampSafetyLimits({ maxPeep: 99, maxPressureLimit: 99, maxTidalVolume: 9999, maxRespiratoryRate: 99, maxIeRatio: 1 });

    expect(clamped).toEqual({
      maxPeep: VENTILATOR_PARAMETER_LIMITS.peepCmH2O.max,
      maxPressureLimit: VENTILATOR_PARAMETER_LIMITS.pressureLimitCmH2O.max,
      maxTidalVolume: VENTILATOR_PARAMETER_LIMITS.tidalVolumeMl.max,
      maxRespiratoryRate: VENTILATOR_PARAMETER_LIMITS.respiratoryRateBpm.max,
      maxIeRatio: 1,
    });
  });
});
