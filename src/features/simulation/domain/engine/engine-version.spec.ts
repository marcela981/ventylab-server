/*
 * Funcionalidad: Pruebas de la versión del motor fisiológico
 * Descripción: Verifica qué versiones reciben la evolución del paciente y qué sesiones reproduce el motor actual sin diferencias (la misma versión o una sesión 1.x en el motor 2.x)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ENGINE_VERSION, engineReplaysVersion, engineSupportsEvolution } from "./engine-version";

describe("engine version", () => {
  it("gives the patient evolution to sessions of engine 2.0.0 or later only", () => {
    expect(engineSupportsEvolution("1.0.0")).toBe(false);
    expect(engineSupportsEvolution("2.0.0")).toBe(true);
    expect(engineSupportsEvolution("x")).toBe(false);
  });

  it("reproduces the same version and 1.x sessions on a 2.x engine, nothing else", () => {
    expect(engineReplaysVersion(ENGINE_VERSION)).toBe(true);
    expect(engineReplaysVersion("1.0.0", "2.0.0")).toBe(true);
    expect(engineReplaysVersion("2.0.0", "1.0.0")).toBe(false);
    expect(engineReplaysVersion("0.9.0", "2.0.0")).toBe(false);
    expect(engineReplaysVersion("2.1.0", "2.0.0")).toBe(false);
  });
});
