/*
 * Funcionalidad: Filtro de tema del tutor
 * Descripción: Lista determinista de términos de medicina, sistema respiratorio y ventilación mecánica (español e inglés) usada como respaldo de TOPIC_CHECK, análisis estricto de la respuesta JSON {"onTopic": boolean} y respuesta fija de rechazo para mensajes fuera de tema
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const OFF_TOPIC_REPLY: string =
  "Lo siento, solo puedo ayudarte con temas de ventilación mecánica, fisiología respiratoria y temas clínicos relacionados. ¿Tienes alguna pregunta sobre esos temas?";

// Matched against the start of each word, so "ventil" covers ventilación, ventilator, ventilated...
const TOPIC_STEMS: readonly string[] = [
  "ventil",
  "respir",
  "pulmon",
  "pulmo",
  "alveol",
  "oxigen",
  "oxygen",
  "hipox",
  "hypox",
  "hiperox",
  "hyperox",
  "hipercap",
  "hypercap",
  "hipocap",
  "hypocap",
  "hipovent",
  "hypovent",
  "hiperven",
  "hypervent",
  "complian",
  "distensib",
  "elastan",
  "traque",
  "trache",
  "intub",
  "extub",
  "saturac",
  "saturat",
  "gasometr",
  "capnog",
  "neumon",
  "pneumon",
  "neumot",
  "pneumot",
  "bronq",
  "bronch",
  "diafragm",
  "diaphragm",
  "disnea",
  "dyspn",
  "apnea",
  "apnoea",
  "taquipn",
  "tachypn",
  "acidosis",
  "alcalosis",
  "alkalosis",
  "barotrau",
  "volutrau",
  "atelect",
  "edema",
  "oedema",
  "sedac",
  "sedat",
  "fisiolog",
  "physiolog",
  "fisiopat",
  "pathophysiol",
  "clinic",
  "medic",
  "paciente",
  "patient",
  "enfermedad",
  "disease",
  "sintoma",
  "symptom",
  "diagnost",
  "terapi",
  "therap",
  "tratamiento",
  "treatment",
  "anestes",
  "anesthe",
  "anaesthe",
  "cardi",
  "hemodin",
  "hemodyn",
  "sangu",
  "pulso",
  "destete",
  "weaning",
  "espiraci",
  "expirat",
  "inspira",
  "inhala",
  "exhala",
  "presion",
  "pressure",
  "asincron",
  "asynchron",
  "mecanica",
  "mechanical",
];

const TOPIC_WORDS: readonly string[] = [
  "peep",
  "fio2",
  "spo2",
  "sao2",
  "pao2",
  "paco2",
  "etco2",
  "co2",
  "o2",
  "sdra",
  "ards",
  "epoc",
  "copd",
  "asma",
  "asthma",
  "uci",
  "icu",
  "uti",
  "cpap",
  "bipap",
  "bpap",
  "vmni",
  "niv",
  "simv",
  "psv",
  "prvc",
  "aprv",
  "tidal",
  "pulmones",
  "lung",
  "lungs",
  "airway",
  "airways",
  "plateau",
  "meseta",
  "sangre",
  "blood",
  "heart",
  "corazon",
  "ph",
  "vt",
  "fr",
];

const WORD_PATTERN: RegExp = /[a-z0-9]+/g;

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function termListCheck(message: string): boolean {
  const words: string[] = normalize(message).match(WORD_PATTERN) ?? [];

  return words.some(
    (word: string) => TOPIC_WORDS.includes(word) || TOPIC_STEMS.some((stem: string) => word.startsWith(stem)),
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTopicCheckResponse(content: string): boolean | undefined {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content.trim());
  } catch {
    return undefined;
  }

  if (!isPlainObject(parsed) || Object.keys(parsed).length !== 1 || typeof parsed.onTopic !== "boolean") {
    return undefined;
  }

  return parsed.onTopic;
}
