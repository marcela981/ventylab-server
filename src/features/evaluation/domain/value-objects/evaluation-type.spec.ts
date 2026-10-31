/*
 * Funcionalidad: Pruebas de la política por tipo de evaluación
 * Descripción: Verifica la retroalimentación inmediata (QUIZ y WORKSHOP) y la publicación automática de la nota (QUIZ y WORKSHOP siempre, EXAM solo con showResultsImmediately)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { autoPublishFor, immediateFeedbackFor } from "@/features/evaluation/domain/value-objects/evaluation-type";

describe("evaluation type policy", () => {
  it("gives immediate feedback only for QUIZ and WORKSHOP", () => {
    expect(immediateFeedbackFor("QUIZ")).toBe(true);
    expect(immediateFeedbackFor("WORKSHOP")).toBe(true);
    expect(immediateFeedbackFor("EXAM")).toBe(false);
  });

  it("auto-publishes QUIZ and WORKSHOP whatever the column says", () => {
    expect(autoPublishFor("QUIZ", false)).toBe(true);
    expect(autoPublishFor("WORKSHOP", false)).toBe(true);
  });

  it("lets showResultsImmediately decide for EXAM", () => {
    expect(autoPublishFor("EXAM", false)).toBe(false);
    expect(autoPublishFor("EXAM", true)).toBe(true);
  });
});
