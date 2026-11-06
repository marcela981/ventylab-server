/*
 * Funcionalidad: Pruebas del servicio de comparación de configuraciones
 * Descripción: Documenta las reglas de clasificación (rango aceptable, tolerancia del 10 %, umbrales por prioridad, parámetros omitidos, parámetros no definidos por el experto, modo y relación I:E) y de puntaje (fórmulas por clasificación, piso para los parámetros omitidos y promedio ponderado por prioridad) de compareConfigurations, con casos en cada límite y justo por encima o por debajo
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import {
  type AcceptableRange,
  type ConfigurationComparison,
  type ErrorClassification,
  type ExpertConfigurationData,
  type ParameterComparison,
  type VentilatorConfiguration,
} from "@/features/clinical-cases/domain/read-models/configuration-comparison.read-model";
import { compareConfigurations } from "@/features/clinical-cases/domain/services/configuration-comparison";

type Priority = "CRITICO" | "IMPORTANTE" | "OPCIONAL";

const MODE: string = "VCV";
// Expert value of 100 makes the percentage deviation equal to the absolute difference.
const EXPERT_VALUE: number = 100;
const ALL_PRIORITIES: Priority[] = ["CRITICO", "IMPORTANTE", "OPCIONAL"];

function buildExpert(overrides: Partial<ExpertConfigurationData> = {}): ExpertConfigurationData {
  return { id: "expert-1", ventilationMode: MODE, justification: "Estrategia protectora", ...overrides };
}

function buildUser(overrides: Partial<VentilatorConfiguration> = {}): VentilatorConfiguration {
  return { ventilationMode: MODE, ...overrides };
}

interface SingleParameterCase {
  user: number | undefined;
  expert?: number;
  priority?: Priority;
  range?: AcceptableRange;
}

interface SingleParameterResult {
  comparison: ParameterComparison;
  result: ConfigurationComparison;
}

/**
 * Compares only tidalVolume. Both modes are empty so the mode comparison is skipped
 * (the service only compares modes when both are non-empty), which makes the global
 * score equal to the score of this single parameter.
 */
function compareSingle(testCase: SingleParameterCase): SingleParameterResult {
  const expert: ExpertConfigurationData = buildExpert({
    ventilationMode: "",
    tidalVolume: testCase.expert ?? EXPERT_VALUE,
    acceptableRanges: testCase.range ? { tidalVolume: testCase.range } : undefined,
    parameterPriorities: testCase.priority ? { tidalVolume: testCase.priority } : undefined,
  });
  const user: VentilatorConfiguration = buildUser({ ventilationMode: "", tidalVolume: testCase.user });

  const result: ConfigurationComparison = compareConfigurations(user, expert);

  return { comparison: findParameter(result, "tidalVolume"), result };
}

function findParameter(result: ConfigurationComparison, parameter: string): ParameterComparison {
  const comparison: ParameterComparison | undefined = result.parameters.find((p: ParameterComparison) => p.parameter === parameter);

  if (!comparison) {
    throw new Error(`Parameter ${parameter} missing from the comparison`);
  }

  return comparison;
}

// Wide range so that every deviation used in rule 1 and rule 7 stays inside it.
const WIDE_RANGE: AcceptableRange = { min: 50, max: 150 };
// Narrow range so that every deviation used in rule 2 falls outside it.
const NARROW_RANGE: AcceptableRange = { min: 99, max: 101 };

describe("compareConfigurations", () => {
  describe("rule 1: inside the acceptable range", () => {
    it.each(ALL_PRIORITIES)("classifies a 5 %% deviation as correct (%s)", (priority: Priority) => {
      const { comparison }: SingleParameterResult = compareSingle({ user: 105, priority, range: WIDE_RANGE });

      expect(comparison.withinRange).toBe(true);
      expect(comparison.errorClassification).toBe("correcto");
    });

    it.each(ALL_PRIORITIES)("classifies a 5.5 %% deviation as a minor error (%s)", (priority: Priority) => {
      const { comparison }: SingleParameterResult = compareSingle({ user: 94.5, priority, range: WIDE_RANGE });

      expect(comparison.withinRange).toBe(true);
      expect(comparison.errorClassification).toBe("menor");
    });
  });

  describe("rule 2: outside the acceptable range, by priority", () => {
    it.each<[Priority, number, ErrorClassification]>([
      ["CRITICO", 120, "moderado"],
      ["CRITICO", 120.5, "critico"],
      ["IMPORTANTE", 130, "menor"],
      ["IMPORTANTE", 130.5, "moderado"],
      ["OPCIONAL", 150, "menor"],
      ["OPCIONAL", 150.5, "moderado"],
    ])("%s with user value %s is classified as %s", (priority: Priority, user: number, expected: ErrorClassification) => {
      const { comparison }: SingleParameterResult = compareSingle({ user, priority, range: NARROW_RANGE });

      expect(comparison.withinRange).toBe(false);
      expect(comparison.errorClassification).toBe(expected);
    });

    it("applies the thresholds to deviations below the expert value as well", () => {
      const atLimit: SingleParameterResult = compareSingle({ user: 80, priority: "CRITICO", range: NARROW_RANGE });
      const aboveLimit: SingleParameterResult = compareSingle({ user: 79.5, priority: "CRITICO", range: NARROW_RANGE });

      expect(atLimit.comparison.errorClassification).toBe("moderado");
      expect(aboveLimit.comparison.errorClassification).toBe("critico");
    });

    it("defaults a parameter without priority to OPCIONAL", () => {
      const atLimit: SingleParameterResult = compareSingle({ user: 150, range: NARROW_RANGE });
      const aboveLimit: SingleParameterResult = compareSingle({ user: 150.5, range: NARROW_RANGE });

      expect(atLimit.comparison.priority).toBe("OPCIONAL");
      expect(atLimit.comparison.errorClassification).toBe("menor");
      expect(aboveLimit.comparison.errorClassification).toBe("moderado");
    });
  });

  describe("rule 3: ±10 % tolerance when no acceptable range is defined", () => {
    it.each([110, 90])("treats user value %s (10 %% deviation) as inside the range", (user: number) => {
      const { comparison }: SingleParameterResult = compareSingle({ user, priority: "CRITICO" });

      expect(comparison.acceptableRange).toBeUndefined();
      expect(comparison.withinRange).toBe(true);
      expect(comparison.errorClassification).toBe("menor");
    });

    it.each([110.5, 89.5])("treats user value %s (10.5 %% deviation) as outside the range", (user: number) => {
      const { comparison }: SingleParameterResult = compareSingle({ user, priority: "CRITICO" });

      expect(comparison.withinRange).toBe(false);
      expect(comparison.errorClassification).toBe("moderado");
    });

    it("uses the defined range instead of the tolerance when it exists", () => {
      const { comparison }: SingleParameterResult = compareSingle({ user: 115, priority: "CRITICO", range: { min: 90, max: 120 } });

      expect(comparison.withinRange).toBe(true);
      expect(comparison.errorClassification).toBe("menor");
    });
  });

  describe("rule 4: parameter omitted by the student", () => {
    it("classifies an omitted CRITICO parameter as critical and lists it as a critical error", () => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user: undefined, priority: "CRITICO" });

      expect(comparison.errorClassification).toBe("critico");
      expect(comparison.withinRange).toBe(false);
      expect(result.criticalErrors).toEqual(["Volumen Tidal (Vt)"]);
    });

    it.each<Priority | undefined>(["IMPORTANTE", "OPCIONAL", undefined])("classifies an omitted parameter with priority %s as moderate (none defaults to OPCIONAL)", (priority: Priority | undefined) => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user: undefined, priority });

      expect(comparison.errorClassification).toBe("moderado");
      expect(result.criticalErrors).toEqual([]);
    });

    // An omitted parameter has no deviation, so it gets the floor of its classification.
    it("scores an omitted CRITICO parameter with the critical floor of 0", () => {
      const { result }: SingleParameterResult = compareSingle({ user: undefined, priority: "CRITICO" });

      expect(result.score).toBe(0);
    });

    it.each<Priority>(["IMPORTANTE", "OPCIONAL"])("scores an omitted %s parameter with the moderate floor of 40", (priority: Priority) => {
      const { result }: SingleParameterResult = compareSingle({ user: undefined, priority });

      expect(result.score).toBe(40);
    });
  });

  describe("parameters the expert did not define", () => {
    it("ignores a parameter the student filled in but the expert did not define", () => {
      const withoutExtra: ConfigurationComparison = buildMixedComparison();
      const withExtra: ConfigurationComparison = buildMixedComparison({ maxPressure: 35 });

      expect(withExtra.parameters.map((p: ParameterComparison) => p.parameter)).not.toContain("maxPressure");
      expect(withExtra.totalParameters).toBe(withoutExtra.totalParameters);
      expect(withExtra.score).toBe(withoutExtra.score);
      expect(withExtra.criticalErrors).toEqual(withoutExtra.criticalErrors);
    });

    it("ignores it even when the student value deviates and the parameter has a priority", () => {
      const result: ConfigurationComparison = compareConfigurations(
        buildUser({ tidalVolume: 450, maxPressure: 80 }),
        buildExpert({ tidalVolume: 450, parameterPriorities: { maxPressure: "CRITICO" } }),
      );

      expect(result.parameters.map((p: ParameterComparison) => p.parameter)).toEqual(["tidalVolume", "ventilationMode"]);
      expect(result.totalParameters).toBe(2);
      expect(result.score).toBe(100);
      expect(result.criticalErrors).toEqual([]);
    });
  });

  describe("rule 5: ventilation mode", () => {
    it("classifies a different mode as a critical error", () => {
      const result: ConfigurationComparison = compareConfigurations(buildUser({ ventilationMode: "PCV" }), buildExpert());
      const mode: ParameterComparison = findParameter(result, "ventilationMode");

      expect(mode.errorClassification).toBe("critico");
      expect(mode.priority).toBe("CRITICO");
      expect(result.criticalErrors).toEqual(["Modo de Ventilación"]);
    });

    it("treats the same mode with different letter case as correct", () => {
      const result: ConfigurationComparison = compareConfigurations(buildUser({ ventilationMode: "vcv" }), buildExpert());

      expect(findParameter(result, "ventilationMode").errorClassification).toBe("correcto");
      expect(result.criticalErrors).toEqual([]);
    });
  });

  describe("rule 6: I:E ratio", () => {
    it("classifies a different ratio as a moderate error", () => {
      const result: ConfigurationComparison = compareConfigurations(buildUser({ iERatio: "1:3" }), buildExpert({ iERatio: "1:2" }));
      const ratio: ParameterComparison = findParameter(result, "iERatio");

      expect(ratio.errorClassification).toBe("moderado");
      expect(result.criticalErrors).toEqual([]);
    });

    it.each(["1 : 2", " 1:2 ", "1: 2"])("treats %p as equal to 1:2", (userRatio: string) => {
      const result: ConfigurationComparison = compareConfigurations(buildUser({ iERatio: userRatio }), buildExpert({ iERatio: "1:2" }));

      expect(findParameter(result, "iERatio").errorClassification).toBe("correcto");
    });
  });

  describe("rule 7: score per parameter", () => {
    it("gives 100 to a correct parameter", () => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user: 103, range: WIDE_RANGE });

      expect(comparison.errorClassification).toBe("correcto");
      expect(result.score).toBe(100);
    });

    it.each<[number, number]>([
      [119, 81],
      [120, 80],
      [130, 80],
    ])("inside the range with d > 5 %%: user value %d scores max(80, 100 - |d|) = %d", (user: number, expected: number) => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user, range: WIDE_RANGE });

      expect(comparison.withinRange).toBe(true);
      expect(comparison.errorClassification).toBe("menor");
      expect(result.score).toBeCloseTo(expected, 2);
    });

    // A minor error outside the range only exists for |d| <= 50 (OPCIONAL), so 100 - 0.5|d| >= 75
    // and the floor of 60 can never be reached; the cases cover the formula at both thresholds.
    it.each<[Priority, number, number]>([
      ["IMPORTANTE", 130, 85],
      ["OPCIONAL", 150, 75],
    ])("minor error (%s, user value %d) scores max(60, 100 - 0.5|d|) = %d", (priority: Priority, user: number, expected: number) => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user, priority, range: NARROW_RANGE });

      expect(comparison.errorClassification).toBe("menor");
      expect(result.score).toBeCloseTo(expected, 2);
    });

    it.each<[number, number]>([
      [159, 41],
      [160, 40],
      [180, 40],
    ])("moderate error (IMPORTANTE, user value %d) scores max(40, 100 - |d|) = %d", (user: number, expected: number) => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user, priority: "IMPORTANTE", range: NARROW_RANGE });

      expect(comparison.errorClassification).toBe("moderado");
      expect(result.score).toBeCloseTo(expected, 2);
    });

    it.each<[number, number]>([
      [160, 10],
      [166, 1],
      [170, 0],
    ])("critical error (CRITICO, user value %d) scores max(0, 100 - 1.5|d|) = %d", (user: number, expected: number) => {
      const { comparison, result }: SingleParameterResult = compareSingle({ user, priority: "CRITICO", range: NARROW_RANGE });

      expect(comparison.errorClassification).toBe("critico");
      expect(result.score).toBeCloseTo(expected, 2);
    });
  });

  describe("rule 8: global score as a priority-weighted average", () => {
    it("weights CRITICO with 3 against OPCIONAL with 1", () => {
      // tidalVolume CRITICO, d = 70 % -> critical -> max(0, 100 - 105) = 0, weight 3
      // peep OPCIONAL, identical -> correct -> 100, weight 1
      // (0 * 3 + 100 * 1) / (3 + 1) = 25
      const result: ConfigurationComparison = compareConfigurations(
        buildUser({ ventilationMode: "", tidalVolume: 170, peep: 10 }),
        buildExpert({
          ventilationMode: "",
          tidalVolume: 100,
          peep: 10,
          acceptableRanges: { tidalVolume: NARROW_RANGE },
          parameterPriorities: { tidalVolume: "CRITICO", peep: "OPCIONAL" },
        }),
      );

      expect(result.score).toBeCloseTo(25, 2);
    });

    it("weights IMPORTANTE with 2 against OPCIONAL with 1", () => {
      // tidalVolume IMPORTANTE, d = 60 % -> moderate -> max(40, 100 - 60) = 40, weight 2
      // peep OPCIONAL, identical -> correct -> 100, weight 1
      // (40 * 2 + 100 * 1) / (2 + 1) = 60
      const result: ConfigurationComparison = compareConfigurations(
        buildUser({ ventilationMode: "", tidalVolume: 160, peep: 10 }),
        buildExpert({
          ventilationMode: "",
          tidalVolume: 100,
          peep: 10,
          acceptableRanges: { tidalVolume: NARROW_RANGE },
          parameterPriorities: { tidalVolume: "IMPORTANTE", peep: "OPCIONAL" },
        }),
      );

      expect(result.score).toBeCloseTo(60, 2);
    });

    it("computes the weighted average of several parameters (hand-calculated)", () => {
      const result: ConfigurationComparison = buildMixedComparison();

      // Parameter        Priority (w)    User / expert   d        Classification       Score
      // ventilationMode  CRITICO (3)     VCV / VCV       -        correct              100
      // tidalVolume      CRITICO (3)     450 / 450       0 %      correct              100
      // peep             IMPORTANTE (2)  13 / 10         30 %     minor (out of 8-12)  max(60, 100 - 15) = 85
      // fio2             CRITICO (3)     70 / 40         75 %     critical (35-45)     max(0, 100 - 112.5) = 0
      // respiratoryRate  OPCIONAL (1)    21.5 / 20       7.5 %    minor (±10 %, in)    max(80, 100 - 7.5) = 92.5
      //
      // Weighted sum: 100*3 + 100*3 + 85*2 + 0*3 + 92.5*1 = 862.5
      // Total weight: 3 + 3 + 2 + 3 + 1 = 12
      // Score: 862.5 / 12 = 71.875 -> rounded to two decimals = 71.88
      expect(result.score).toBeCloseTo(71.88, 2);
    });

    it("keeps the global score between 0 and 100", () => {
      const worst: ConfigurationComparison = compareConfigurations(
        buildUser({ ventilationMode: "PCV", tidalVolume: 300, fio2: 100 }),
        buildExpert({ tidalVolume: 100, fio2: 40, parameterPriorities: { tidalVolume: "CRITICO", fio2: "CRITICO" } }),
      );
      const best: ConfigurationComparison = compareConfigurations(buildUser({ tidalVolume: 100 }), buildExpert({ tidalVolume: 100 }));

      expect(worst.score).toBe(0);
      expect(best.score).toBe(100);
    });

    it("lowers the global score when the student omits a parameter of an otherwise identical configuration", () => {
      const expert: ExpertConfigurationData = buildExpert({
        tidalVolume: 450,
        fio2: 40,
        peep: 10,
        parameterPriorities: { tidalVolume: "CRITICO", fio2: "CRITICO", peep: "IMPORTANTE" },
      });

      const complete: ConfigurationComparison = compareConfigurations(buildUser({ tidalVolume: 450, fio2: 40, peep: 10 }), expert);
      const withoutPeep: ConfigurationComparison = compareConfigurations(buildUser({ tidalVolume: 450, fio2: 40 }), expert);

      // Complete: every parameter correct -> 100.
      // Without PEEP: mode 100*3 + tidalVolume 100*3 + fio2 100*3 + peep (omitted, moderate floor) 40*2 = 980
      // Total weight: 3 + 3 + 3 + 2 = 11 -> 980 / 11 = 89.0909... -> rounded to two decimals = 89.09
      expect(complete.score).toBe(100);
      expect(withoutPeep.score).toBeCloseTo(89.09, 2);
      expect(withoutPeep.totalParameters).toBe(complete.totalParameters);
    });
  });

  describe("rule 9: configuration identical to the expert", () => {
    it("scores 100 with every parameter correct and no critical errors", () => {
      const values: VentilatorConfiguration = {
        ventilationMode: MODE,
        tidalVolume: 450,
        respiratoryRate: 18,
        peep: 10,
        fio2: 40,
        maxPressure: 30,
        iERatio: "1:2",
      };

      const result: ConfigurationComparison = compareConfigurations(
        buildUser(values),
        buildExpert({
          ...values,
          parameterPriorities: { tidalVolume: "CRITICO", peep: "IMPORTANTE", fio2: "CRITICO" },
          acceptableRanges: { peep: { min: 8, max: 12 } },
        }),
      );

      expect(result.score).toBe(100);
      expect(result.totalParameters).toBe(7);
      expect(result.parameters.every((p: ParameterComparison) => p.errorClassification === "correcto")).toBe(true);
      expect(result.criticalErrors).toEqual([]);
    });
  });

  describe("rule 10: result counts match the per-parameter classification", () => {
    it("derives totalParameters, correctParameters, criticalErrors and summary from the parameters", () => {
      const result: ConfigurationComparison = buildMixedComparison();
      const countOf = (classification: ErrorClassification): number =>
        result.parameters.filter((p: ParameterComparison) => p.errorClassification === classification).length;

      expect(result.totalParameters).toBe(result.parameters.length);
      expect(result.totalParameters).toBe(5);
      expect(result.correctParameters).toBe(countOf("correcto"));
      expect(result.correctParameters).toBe(2);
      expect(result.criticalErrors).toHaveLength(countOf("critico"));
      expect(result.criticalErrors).toEqual(["FiO2"]);
      expect(result.summary).toEqual({ correct: 2, minor: 2, moderate: 0, critical: 1 });
    });
  });
});

function buildMixedComparison(userOverrides: Partial<VentilatorConfiguration> = {}): ConfigurationComparison {
  return compareConfigurations(
    buildUser({ tidalVolume: 450, peep: 13, fio2: 70, respiratoryRate: 21.5, ...userOverrides }),
    buildExpert({
      tidalVolume: 450,
      peep: 10,
      fio2: 40,
      respiratoryRate: 20,
      acceptableRanges: { peep: { min: 8, max: 12 }, fio2: { min: 35, max: 45 } },
      parameterPriorities: { tidalVolume: "CRITICO", peep: "IMPORTANTE", fio2: "CRITICO", respiratoryRate: "OPCIONAL" },
    }),
  );
}
