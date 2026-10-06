/*
 * Funcionalidad: Pruebas de ComputeCurriculumUnlockUseCase
 * Descripción: Verifica el cálculo de desbloqueo en memoria: niveles bloqueados por prerrequisitos incompletos con missingPrerequisites, módulos bloqueados por su nivel o por módulos prerrequisito, y nodos completados nunca bloqueados
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { ComputeCurriculumUnlockUseCase } from "@/features/curriculum/application/use-cases/compute-curriculum-unlock.usecase";
import { type CurriculumUnlockSource, type CurriculumUnlockState } from "@/features/curriculum/domain/read-models/curriculum-tree.read-model";

const SOURCE: CurriculumUnlockSource = {
  levels: [
    { id: "L1", title: "Basics", moduleIds: ["M1", "M2"] },
    { id: "L2", title: "Advanced", moduleIds: ["M3"] },
  ],
  modules: [
    { id: "M1", title: "Intro", levelId: "L1" },
    { id: "M2", title: "Equation", levelId: "L1" },
    { id: "M3", title: "Modes", levelId: "L2" },
  ],
  levelEdges: [{ nodeId: "L2", prerequisiteId: "L1" }],
  moduleEdges: [{ nodeId: "M2", prerequisiteId: "M1" }],
  completedModuleIds: [],
};

describe("ComputeCurriculumUnlockUseCase.compute", () => {
  it("locks levels and modules whose prerequisites are incomplete", () => {
    const state: CurriculumUnlockState = ComputeCurriculumUnlockUseCase.compute(SOURCE);

    expect(state.levels.get("L1")).toEqual({ locked: false, missingPrerequisites: [] });
    expect(state.levels.get("L2")).toEqual({ locked: true, missingPrerequisites: [{ id: "L1", title: "Basics" }] });
    expect(state.modules.get("M2")).toEqual({ locked: true, missingPrerequisites: [{ id: "M1", title: "Intro" }] });
    expect(state.modules.get("M3")).toEqual({ locked: true, missingPrerequisites: [{ id: "L1", title: "Basics" }] });
  });

  it("unlocks dependents once prerequisites are completed and never locks completed nodes", () => {
    const state: CurriculumUnlockState = ComputeCurriculumUnlockUseCase.compute({ ...SOURCE, completedModuleIds: ["M1", "M2", "M3"] });

    expect(state.completedLevelIds.has("L1")).toBe(true);
    expect(state.levels.get("L2")).toEqual({ locked: false, missingPrerequisites: [] });
    expect(state.modules.get("M3")).toEqual({ locked: false, missingPrerequisites: [] });
  });
});
