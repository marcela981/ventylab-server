/*
 * Funcionalidad: Pruebas del filtro de tema del tutor
 * Descripción: Verifica la lista de términos de medicina, sistema respiratorio y ventilación (español e inglés) y el análisis estricto de la respuesta JSON de TOPIC_CHECK
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { OFF_TOPIC_REPLY, parseTopicCheckResponse, termListCheck } from "@/features/ai-tutor/domain/services/topic-guard";

describe("topic guard", () => {
  it.each([
    "¿Qué es la PEEP y cuándo se aumenta?",
    "Explícame la ventilación mecánica controlada por volumen",
    "¿Por qué baja la saturación de oxígeno en un paciente con SDRA?",
    "How does lung compliance affect the plateau pressure?",
    "What is the tidal volume for a ventilated patient?",
    "Diferencia entre hipoxemia e hipercapnia",
  ])("should accept the on-topic message %s", (message: string) => {
    const result: boolean = termListCheck(message);

    expect(result).toBe(true);
  });

  it.each(["¿Quién ganó el partido de fútbol ayer?", "Write me a poem about the sea", "Recomiéndame una receta de pasta", ""])(
    "should reject the off-topic message %s",
    (message: string) => {
      const result: boolean = termListCheck(message);

      expect(result).toBe(false);
    },
  );

  it("should not match a term inside an unrelated word", () => {
    const result: boolean = termListCheck("Me gusta la pepita de calabaza");

    expect(result).toBe(false);
  });

  it("should parse a strict TOPIC_CHECK JSON response", () => {
    const onTopic: boolean | undefined = parseTopicCheckResponse("{\"onTopic\": true}");
    const offTopic: boolean | undefined = parseTopicCheckResponse(" {\"onTopic\":false} ");

    expect(onTopic).toBe(true);
    expect(offTopic).toBe(false);
  });

  it.each(["", "sí", "{\"onTopic\": \"true\"}", "{\"topic\": true}", "[true]", "```json\n{\"onTopic\": true}\n```", "{\"onTopic\": true, \"extra\": 1}", "null"])(
    "should reject the malformed TOPIC_CHECK response %s",
    (content: string) => {
      const result: boolean | undefined = parseTopicCheckResponse(content);

      expect(result).toBeUndefined();
    },
  );

  it("should keep a polite Spanish refusal for off-topic messages", () => {
    expect(OFF_TOPIC_REPLY).toMatch(/ventilación mecánica/);
  });
});
