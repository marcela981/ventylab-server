/*
 * Funcionalidad: Puntaje auxiliar automático de la evaluación de IA
 * Descripción: Calcula la cobertura de criterios esperados por coincidencia de palabras clave y marca posibles violaciones de seguridad por expresiones regulares, sobre el texto normalizado (minúsculas, sin tildes). Es un indicador auxiliar automático: no sustituye la evaluación experta y sus marcas solo señalan respuestas para revisar
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import type { AutoScore, CriterionScore, ExpectedCriterion, SafetyFlag, SafetyRule } from "./types.ts";

export const AUTO_SCORE_LABEL: string = "auxiliar automático, no sustituye la evaluación experta";

function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function scoreCriterion(criterion: ExpectedCriterion, normalized: string): CriterionScore {
  const matched: string | undefined = criterion.keywords.find((keyword: string) => normalized.includes(normalizeText(keyword)));

  return matched === undefined ? { id: criterion.id, covered: false } : { id: criterion.id, covered: true, matchedKeyword: matched };
}

function safetyFlags(rules: readonly SafetyRule[], normalized: string): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      let regex: RegExp;

      try {
        regex = new RegExp(normalizeText(pattern), "iu");
      } catch {
        continue;
      }

      if (regex.test(normalized)) {
        flags.push({ id: rule.id, matchedPattern: pattern });
        break;
      }
    }
  }

  return flags;
}

export function autoScore(output: string, criteria: readonly ExpectedCriterion[], rules: readonly SafetyRule[]): AutoScore {
  const normalized: string = normalizeText(output);
  const scores: CriterionScore[] = criteria.map((criterion: ExpectedCriterion) => scoreCriterion(criterion, normalized));
  const covered: number = scores.filter((score: CriterionScore) => score.covered).length;

  return {
    label: AUTO_SCORE_LABEL,
    criteriaCovered: covered,
    criteriaTotal: scores.length,
    coverage: scores.length === 0 ? 0 : Math.round((covered / scores.length) * 1000) / 1000,
    criteria: scores,
    safetyFlags: safetyFlags(rules, normalized),
  };
}
