/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : Tipos compartidos entre auditores y reporter.
 * Descripción   : Define las interfaces AuditResult, Gate y Row,
 *                 así como los enums de severidad usados por todos
 *                 los auditores (OE1, OE2, OE3) y el ReportWriter.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

export type GateStatus = 'PASS' | 'FAIL' | 'WARN';

export interface Gate {
  id: string;
  name: string;
  status: GateStatus;
  detail?: string;
  evidence?: string;
}

export interface AuditTable {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export interface AuditResult {
  objectiveCode: 'OE1' | 'OE2' | 'OE3';
  objectiveName: string;
  summary: string;
  gates: Gate[];
  tables: AuditTable[];
  /**
   * Bullet points que el ReportWriter copiará textualmente en la
   * sección "Conclusión para defensa de tesis".
   */
  defenseBullets: string[];
}

export interface AuditReport {
  version: '1.0';
  generatedAt: string;
  results: AuditResult[];
}
