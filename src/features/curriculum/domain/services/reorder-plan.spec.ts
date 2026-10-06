/*
 * Funcionalidad: Pruebas del plan de reordenamiento
 * Descripción: Verifica que el plan reutilice las posiciones actuales, use índices cuando hay órdenes repetidos y rechace listas vacías, duplicadas, con ids desconocidos o incompletas cuando el ámbito exige todos los elementos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { buildReorderPlan, type OrderedItem, type ReorderEntry } from "@/features/curriculum/domain/services/reorder-plan";

const CURRENT: OrderedItem[] = [
  { id: "a", order: 3 },
  { id: "b", order: 5 },
  { id: "c", order: 9 },
];

describe("buildReorderPlan", () => {
  it("permutes the current order slots in the requested sequence", () => {
    const plan: ReorderEntry[] | undefined = buildReorderPlan(CURRENT, ["c", "a", "b"], true);

    expect(plan).toEqual([
      { id: "c", order: 3 },
      { id: "a", order: 5 },
      { id: "b", order: 9 },
    ]);
  });

  it("falls back to positional indexes when current orders collide", () => {
    const current: OrderedItem[] = [
      { id: "a", order: 0 },
      { id: "b", order: 0 },
    ];

    const plan: ReorderEntry[] | undefined = buildReorderPlan(current, ["b", "a"], true);

    expect(plan).toEqual([
      { id: "b", order: 0 },
      { id: "a", order: 1 },
    ]);
  });

  it("allows a partial list when the scope does not require every item", () => {
    const plan: ReorderEntry[] | undefined = buildReorderPlan(CURRENT, ["c", "a"], false);

    expect(plan).toEqual([
      { id: "c", order: 3 },
      { id: "a", order: 9 },
    ]);
  });

  it("rejects duplicates, unknown ids, empty lists and incomplete lists", () => {
    const duplicated: ReorderEntry[] | undefined = buildReorderPlan(CURRENT, ["a", "a", "b"], false);
    const unknown: ReorderEntry[] | undefined = buildReorderPlan(CURRENT, ["a", "x"], false);
    const empty: ReorderEntry[] | undefined = buildReorderPlan(CURRENT, [], false);
    const incomplete: ReorderEntry[] | undefined = buildReorderPlan(CURRENT, ["a", "b"], true);

    expect(duplicated).toBeUndefined();
    expect(unknown).toBeUndefined();
    expect(empty).toBeUndefined();
    expect(incomplete).toBeUndefined();
  });
});
