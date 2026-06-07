/**
 * VentyLab — Auditoría E2E de Sistema Ciberfísico
 * ===============================================
 * Funcionalidad : E2EAuditor — clase base local (Strategy Pattern).
 * Descripción   : Análogo a scripts/auditors/Auditor pero con
 *                 objectiveCode tipado como string genérico para
 *                 admitir los códigos G1..G6 del audit ciberfísico.
 *                 Mantiene la misma interfaz pública (run, makeGate,
 *                 aggregateStatus) para preservar el patrón.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import type { Gate, GateStatus, AuditTable } from '../reporting/types';

export type { Gate, GateStatus, AuditTable };

export interface E2EAuditResult {
  objectiveCode: string;
  objectiveName: string;
  summary: string;
  gates: Gate[];
  tables: AuditTable[];
  defenseBullets: string[];
}

export abstract class E2EAuditor {
  abstract readonly objectiveCode: string;
  abstract readonly objectiveName: string;

  abstract run(): Promise<E2EAuditResult>;

  protected makeGate(
    id: string,
    name: string,
    status: GateStatus,
    detail?: string,
    evidence?: string,
  ): Gate {
    return { id, name, status, detail, evidence };
  }

  protected aggregateStatus(gates: Gate[]): GateStatus {
    if (gates.some((g) => g.status === 'FAIL')) return 'FAIL';
    if (gates.some((g) => g.status === 'WARN')) return 'WARN';
    return 'PASS';
  }

  protected summarize(gates: Gate[]): string {
    const passed = gates.filter((g) => g.status === 'PASS').length;
    return `${this.objectiveCode}: ${passed}/${gates.length} gates en estado PASS.`;
  }
}
