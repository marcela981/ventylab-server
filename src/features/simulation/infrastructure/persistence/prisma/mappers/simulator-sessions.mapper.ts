/*
 * Funcionalidad: Mapper de persistencia de sesiones del simulador
 * Descripción: Convierte filas de simulator_sessions (Prisma, columnas JSON de parámetros y lecturas) en el agregado SimulatorSession y el agregado en la entrada de upsert
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type SimulatorSession as SimulatorSessionModel } from "@prisma/client";

import { SimulatorSession } from "@/features/simulation/domain/entities/simulator-session.entity";

export class SimulatorSessionsMapper {
  public static toDomain(row: SimulatorSessionModel): SimulatorSession {
    return SimulatorSession.reconstitute({
      id: row.id,
      userId: row.userId,
      clinicalCaseId: row.clinicalCaseId ?? undefined,
      isRealVentilator: row.isRealVentilator,
      parametersLog: SimulatorSessionsMapper._toArray(row.parametersLog),
      ventilatorData: SimulatorSessionsMapper._toArray(row.ventilatorData),
      notes: row.notes ?? undefined,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? undefined,
      auditLogs: [],
    });
  }

  public static toPersistence(session: SimulatorSession): Prisma.SimulatorSessionUncheckedCreateInput {
    return {
      id: session.id,
      userId: session.userId,
      clinicalCaseId: session.clinicalCaseId ?? null,
      isRealVentilator: session.isRealVentilator,
      parametersLog: session.parametersLog as Prisma.InputJsonArray,
      ventilatorData: session.ventilatorData as Prisma.InputJsonArray,
      notes: session.notes ?? null,
      startedAt: session.startedAt,
      completedAt: session.completedAt ?? null,
    };
  }

  private static _toArray(value: Prisma.JsonValue): unknown[] {
    return Array.isArray(value) ? value : [];
  }
}
