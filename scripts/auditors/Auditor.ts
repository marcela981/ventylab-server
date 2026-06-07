/**
 * VentyLab — Auditoría de Objetivos Específicos de Tesis
 * ======================================================
 * Funcionalidad : Clase base abstracta Auditor (Strategy Pattern).
 * Descripción   : Define el contrato que cumplen todos los auditores
 *                 (OE1 TeachingAuditor, OE2 EvaluationAuditor,
 *                 OE3 FeedbackAuditor). Cada subclase implementa
 *                 run() retornando un AuditResult uniforme que el
 *                 ReportWriter puede consumir sin conocer detalles
 *                 internos.
 * Versión       : 1.0
 * Autor         : Marcela Mazo Castro
 * Proyecto      : VentyLab
 * Tesis         : Plataforma educativa interactiva para entrenamiento
 *                 en ventilación mecánica.
 * Institución   : Universidad del Valle
 * Contacto      : marcelamazo189@gmail.com
 */

import type { AuditResult, Gate, GateStatus } from '../reporting/types';

export abstract class Auditor {
  abstract readonly objectiveCode: 'OE1' | 'OE2' | 'OE3';
  abstract readonly objectiveName: string;

  abstract run(): Promise<AuditResult>;

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
}
