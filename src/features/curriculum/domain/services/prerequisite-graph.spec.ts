/*
 * Funcionalidad: Pruebas del detector de ciclos de prerrequisitos
 * Descripción: Verifica que wouldCreateCycle detecte autorreferencias y ciclos directos o indirectos (A -> B -> A) y acepte grafos acíclicos y reemplazos que eliminan el ciclo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrerequisiteEdge, wouldCreateCycle } from "@/features/curriculum/domain/services/prerequisite-graph";

describe("wouldCreateCycle", () => {
  it("detects a direct cycle A -> B -> A", () => {
    const edges: PrerequisiteEdge[] = [{ nodeId: "B", prerequisiteId: "A" }];

    const result: boolean = wouldCreateCycle(edges, "A", ["B"]);

    expect(result).toBe(true);
  });

  it("detects an indirect cycle A -> B -> C -> A", () => {
    const edges: PrerequisiteEdge[] = [
      { nodeId: "B", prerequisiteId: "C" },
      { nodeId: "C", prerequisiteId: "A" },
    ];

    const result: boolean = wouldCreateCycle(edges, "A", ["B"]);

    expect(result).toBe(true);
  });

  it("detects a self reference", () => {
    const result: boolean = wouldCreateCycle([], "A", ["A"]);

    expect(result).toBe(true);
  });

  it("accepts an acyclic graph", () => {
    const edges: PrerequisiteEdge[] = [
      { nodeId: "B", prerequisiteId: "C" },
      { nodeId: "D", prerequisiteId: "A" },
    ];

    const result: boolean = wouldCreateCycle(edges, "A", ["B", "C"]);

    expect(result).toBe(false);
  });

  it("ignores the node's current edges because they are being replaced", () => {
    const edges: PrerequisiteEdge[] = [
      { nodeId: "A", prerequisiteId: "B" },
      { nodeId: "B", prerequisiteId: "C" },
    ];

    const result: boolean = wouldCreateCycle(edges, "C", ["A"]);
    const replacing: boolean = wouldCreateCycle(edges, "A", []);

    expect(result).toBe(true);
    expect(replacing).toBe(false);
  });
});
