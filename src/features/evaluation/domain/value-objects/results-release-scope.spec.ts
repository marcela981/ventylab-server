/*
 * Funcionalidad: Pruebas del alcance de la liberación de resultados
 * Descripción: Verifica que solo GRADE_AND_ANSWERS libera las respuestas y que los dos alcances son los únicos valores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { releasesAnswers, RESULTS_RELEASE_SCOPE_VALUES } from "@/features/evaluation/domain/value-objects/results-release-scope";

describe("results release scope", () => {
  it("should release the answers only with GRADE_AND_ANSWERS", () => {
    expect(releasesAnswers("GRADE_AND_ANSWERS")).toBe(true);
    expect(releasesAnswers("GRADE")).toBe(false);
  });

  it("should offer exactly the two scopes", () => {
    expect(RESULTS_RELEASE_SCOPE_VALUES).toEqual(["GRADE", "GRADE_AND_ANSWERS"]);
  });
});
