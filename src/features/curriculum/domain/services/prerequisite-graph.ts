/*
 * Funcionalidad: Detector de ciclos de prerrequisitos
 * Descripción: Recorre con DFS la lista completa de aristas de prerrequisitos (entidad -> prerrequisito) para detectar si reemplazar los prerrequisitos de una entidad crearía una dependencia circular
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface PrerequisiteEdge {
  readonly nodeId: string;
  readonly prerequisiteId: string;
}

export function buildAdjacency(edges: ReadonlyArray<PrerequisiteEdge>): Map<string, string[]> {
  const adjacency: Map<string, string[]> = new Map<string, string[]>();

  for (const edge of edges) {
    adjacency.set(edge.nodeId, [...(adjacency.get(edge.nodeId) ?? []), edge.prerequisiteId]);
  }

  return adjacency;
}

export function wouldCreateCycle(edges: ReadonlyArray<PrerequisiteEdge>, nodeId: string, prerequisiteIds: ReadonlyArray<string>): boolean {
  if (prerequisiteIds.includes(nodeId)) {
    return true;
  }

  const adjacency: Map<string, string[]> = buildAdjacency(edges.filter((edge: PrerequisiteEdge) => edge.nodeId !== nodeId));

  adjacency.set(nodeId, [...prerequisiteIds]);

  return reaches(adjacency, prerequisiteIds, nodeId);
}

export function reaches(adjacency: ReadonlyMap<string, string[]>, startIds: ReadonlyArray<string>, targetId: string): boolean {
  const visited: Set<string> = new Set<string>();
  const stack: string[] = [...startIds];

  while (stack.length > 0) {
    const current: string | undefined = stack.pop();

    if (current === undefined || visited.has(current)) {
      continue;
    }

    if (current === targetId) {
      return true;
    }

    visited.add(current);
    stack.push(...(adjacency.get(current) ?? []));
  }

  return false;
}
