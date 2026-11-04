/*
 * Funcionalidad: Análisis determinista de notas
 * Descripción: Análisis por reglas, sin IA, de las notas del estudiante que se entrega cuando ningún proveedor de IA responde: cuenta notas y palabras, detecta los conceptos de un glosario básico de ventilación mecánica presentes en las notas, mide la cobertura de los términos del título de la lección o módulo y sugiere cómo ampliar las notas; el resumen se marca como análisis automático sin IA, en español o inglés
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EN_LANGUAGE_VALUE, type LanguageValue } from "@/common/domain/value-objects/language";
import { type NotesAnalysisContent } from "@/features/notes/domain/read-models/notes-analysis.read-model";

export const SHORT_NOTES_WORD_THRESHOLD: number = 100;

const MAX_LIST_ITEMS: number = 8;

const MIN_TITLE_TERM_LENGTH: number = 5;

interface GlossaryTerm {
  readonly label: string;
  readonly patterns: readonly RegExp[];
}

// Core concepts of the mechanical ventilation course; each label is shown as written when its pattern appears in the notes.
const VENTILATION_GLOSSARY: readonly GlossaryTerm[] = [
  { label: "PEEP", patterns: [/\bpeep\b/, /presi[oó]n positiva al final de la espiraci[oó]n/, /positive end.expiratory pressure/] },
  { label: "FiO2", patterns: [/\bfio2\b/, /fracci[oó]n inspirada de ox[ií]geno/, /inspired oxygen fraction/] },
  { label: "Volumen corriente / tidal volume", patterns: [/volumen corriente/, /tidal volume/, /\bvt\b/] },
  { label: "Frecuencia respiratoria / respiratory rate", patterns: [/frecuencia respiratoria/, /respiratory rate/] },
  { label: "Presión meseta / plateau pressure", patterns: [/presi[oó]n (de )?meseta/, /plateau/] },
  { label: "Presión pico / peak pressure", patterns: [/presi[oó]n pico/, /peak (inspiratory )?pressure/] },
  { label: "Driving pressure", patterns: [/driving pressure/, /presi[oó]n de distensi[oó]n/] },
  { label: "Distensibilidad / compliance", patterns: [/distensibilidad/, /complacencia/, /compliance/] },
  { label: "Resistencia / resistance", patterns: [/resistencia/, /resistance/] },
  { label: "Relación I:E / I:E ratio", patterns: [/relaci[oó]n i:e/, /i:e ratio/, /\bi:e\b/] },
  { label: "Auto-PEEP", patterns: [/auto.?peep/, /atrapamiento a[eé]reo/, /air trapping/] },
  { label: "Modos ventilatorios / ventilation modes", patterns: [/volumen control/, /presi[oó]n control/, /\bsimv\b/, /presi[oó]n soporte/, /pressure support/, /\bcpap\b/, /\bvcv\b/, /\bpcv\b/] },
  { label: "Gases arteriales / blood gases", patterns: [/gases arteriales/, /blood gas/, /\bpao2\b/, /\bpaco2\b/] },
  { label: "SDRA / ARDS", patterns: [/\bsdra\b/, /\bards\b/, /distr[eé]s respiratorio/] },
  { label: "Destete / weaning", patterns: [/destete/, /weaning/] },
];

const STOPWORDS: ReadonlySet<string> = new Set<string>([
  "sobre", "entre", "desde", "hasta", "para", "como", "parte", "introduccion", "introducción", "conceptos", "basicos", "básicos", "modulo", "módulo", "leccion", "lección",
  "about", "between", "introduction", "concepts", "basic", "module", "lesson", "their", "with",
]);

export interface DeterministicNotesInput {
  readonly texts: readonly string[];
  readonly lessonTitle?: string;
  readonly moduleTitle?: string;
  readonly language: LanguageValue;
}

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFC");
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "");
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((word: string) => /[\p{L}\p{N}]/u.test(word)).length;
}

function titleTerms(...titles: (string | undefined)[]): string[] {
  const terms: string[] = titles
    .flatMap((title: string | undefined) => (title ?? "").split(/[^\p{L}\p{N}]+/u))
    .map((word: string) => normalize(word))
    .filter((word: string) => word.length >= MIN_TITLE_TERM_LENGTH && !STOPWORDS.has(word));

  return [...new Set<string>(terms)];
}

export function buildDeterministicNotesAnalysis(input: DeterministicNotesInput): NotesAnalysisContent {
  const english: boolean = input.language === EN_LANGUAGE_VALUE;
  const corpus: string = normalize(input.texts.join("\n"));
  const plainCorpus: string = stripAccents(corpus);
  const words: number = countWords(corpus);
  const found: string[] = VENTILATION_GLOSSARY.filter((term: GlossaryTerm) => term.patterns.some((pattern: RegExp) => pattern.test(corpus))).map(
    (term: GlossaryTerm) => term.label,
  );
  const terms: string[] = titleTerms(input.lessonTitle, input.moduleTitle);
  const missingTerms: string[] = terms.filter((term: string) => !plainCorpus.includes(stripAccents(term)));
  const covered: number = terms.length - missingTerms.length;

  const summary: string = english
    ? `Automatic analysis, not generated by AI (the AI assistant is not available right now): ${input.texts.length} note(s), ${words} words; ${found.length} key concept(s) of the mechanical ventilation glossary were found${terms.length > 0 ? `, and ${covered} of ${terms.length} terms of the title are mentioned` : ""}.`
    : `Análisis automático sin IA (el asistente de IA no está disponible en este momento): ${input.texts.length} nota(s), ${words} palabras; se encontraron ${found.length} concepto(s) clave del glosario de ventilación mecánica${terms.length > 0 ? ` y se mencionan ${covered} de ${terms.length} términos del título` : ""}.`;

  const gaps: string[] = missingTerms.map((term: string) => (english ? `The term "${term}" of the title does not appear in the notes` : `El término «${term}» del título no aparece en las notas`));
  const suggestions: string[] = [];

  if (words < SHORT_NOTES_WORD_THRESHOLD) {
    suggestions.push(english ? "Expand your notes: explain each concept in your own words with an example." : "Amplía tus notas: explica cada concepto con tus palabras y un ejemplo.");
  }

  if (found.length === 0) {
    suggestions.push(
      english
        ? "Include the key ventilation parameters (PEEP, FiO2, tidal volume, plateau pressure) and how they relate."
        : "Incluye los parámetros clave de la ventilación (PEEP, FiO2, volumen corriente, presión meseta) y cómo se relacionan.",
    );
  }

  if (missingTerms.length > 0) {
    suggestions.push(english ? "Review the lesson content for the terms of its title that your notes do not cover." : "Repasa en la lección los términos de su título que tus notas no cubren.");
  }

  suggestions.push(english ? "Request the AI analysis again later for detailed feedback." : "Vuelve a pedir el análisis con IA más tarde para obtener una retroalimentación detallada.");

  return {
    summary,
    keyConcepts: found.slice(0, MAX_LIST_ITEMS),
    gaps: gaps.slice(0, MAX_LIST_ITEMS),
    suggestions: suggestions.slice(0, MAX_LIST_ITEMS),
  };
}
