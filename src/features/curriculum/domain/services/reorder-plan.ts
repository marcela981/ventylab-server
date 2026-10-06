/*
 * Funcionalidad: Plan de reordenamiento por lotes
 * Descripción: Valida una lista de ids solicitada contra los elementos actuales de un ámbito y calcula el nuevo orden de cada uno reutilizando sus posiciones actuales, para aplicarlo en una sola transacción sin violar restricciones únicas de orden
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface OrderedItem {
  readonly id: string;
  readonly order: number;
}

export interface ReorderEntry {
  readonly id: string;
  readonly order: number;
}

export function buildReorderPlan(current: ReadonlyArray<OrderedItem>, requestedIds: ReadonlyArray<string>, requireAll: boolean): ReorderEntry[] | undefined {
  const currentById: Map<string, OrderedItem> = new Map(current.map((item: OrderedItem): [string, OrderedItem] => [item.id, item]));

  if (requestedIds.length === 0 || new Set(requestedIds).size !== requestedIds.length) {
    return undefined;
  }

  if (requireAll && requestedIds.length !== current.length) {
    return undefined;
  }

  const requestedItems: OrderedItem[] = [];

  for (const id of requestedIds) {
    const item: OrderedItem | undefined = currentById.get(id);

    if (!item) {
      return undefined;
    }

    requestedItems.push(item);
  }

  const slots: number[] = requestedItems.map((item: OrderedItem) => item.order).sort((left: number, right: number) => left - right);
  const slotsAreUnique: boolean = slots.every((slot: number, index: number) => index === 0 || slot > slots[index - 1]);

  return requestedIds.map((id: string, index: number): ReorderEntry => ({ id, order: slotsAreUnique ? slots[index] : index }));
}
