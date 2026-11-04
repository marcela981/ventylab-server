/*
 * Funcionalidad: Carga de escenarios de evaluación de IA
 * Descripción: Lee los archivos JSON de scripts/ai-eval/scenarios en orden alfabético, valida los campos mínimos (id único, caso de uso soportado, idioma, criterios, referencias y estado de validación) y filtra por identificador o prefijo cuando se indica
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { EVAL_USE_CASES, type EvalScenario } from "./types.ts";

class ScenarioValidationError extends Error {
  public constructor(file: string, detail: string) {
    super(`Invalid scenario ${file}: ${detail}`);
    this.name = "ScenarioValidationError";
  }
}

function validateScenario(raw: unknown, file: string): EvalScenario {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ScenarioValidationError(file, "must be a JSON object");
  }

  const scenario: Record<string, unknown> = raw as Record<string, unknown>;

  for (const field of ["id", "category", "useCase", "language", "title", "validationStatus"]) {
    if (typeof scenario[field] !== "string" || (scenario[field] as string).trim() === "") {
      throw new ScenarioValidationError(file, `${field} must be a non-empty string`);
    }
  }

  if (!EVAL_USE_CASES.includes(scenario.useCase as never)) {
    throw new ScenarioValidationError(file, `useCase must be one of ${EVAL_USE_CASES.join(", ")}`);
  }

  if (typeof scenario.input !== "object" || scenario.input === null) {
    throw new ScenarioValidationError(file, "input must be an object");
  }

  for (const field of ["expectedCriteria", "mustNotContain", "references"]) {
    if (!Array.isArray(scenario[field])) {
      throw new ScenarioValidationError(file, `${field} must be an array`);
    }
  }

  if ((scenario.expectedCriteria as unknown[]).length === 0 || (scenario.references as unknown[]).length === 0) {
    throw new ScenarioValidationError(file, "expectedCriteria and references must not be empty");
  }

  return scenario as unknown as EvalScenario;
}

export function loadScenarios(dir: string, filters: readonly string[] = []): EvalScenario[] {
  const files: string[] = readdirSync(dir)
    .filter((name: string) => name.endsWith(".json"))
    .sort();
  const scenarios: EvalScenario[] = [];
  const seen: Set<string> = new Set<string>();

  for (const file of files) {
    const scenario: EvalScenario = validateScenario(JSON.parse(readFileSync(join(dir, file), "utf8")), file);

    if (seen.has(scenario.id)) {
      throw new ScenarioValidationError(file, `duplicated id ${scenario.id}`);
    }

    seen.add(scenario.id);

    if (filters.length === 0 || filters.some((filter: string) => scenario.id === filter || scenario.id.startsWith(filter))) {
      scenarios.push(scenario);
    }
  }

  return scenarios;
}
