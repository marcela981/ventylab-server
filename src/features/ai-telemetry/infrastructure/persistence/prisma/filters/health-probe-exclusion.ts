/*
 * Funcionalidad: Exclusión de las sondas de salud en las lecturas de telemetría de IA
 * Descripción: Condiciones de Prisma y de SQL parametrizado que descartan de ai_call_logs las filas de las sondas de salud de los proveedores (ref_type = HEALTH_PROBE_REF_TYPE) conservando las filas sin referencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Prisma } from "@prisma/client";

import { HEALTH_PROBE_REF_TYPE } from "@/features/ai-telemetry/domain/read-models/ai-call-log.read-model";

// A plain `<>` would also drop rows whose ref_type is NULL, which are most calls.
export const EXCLUDE_HEALTH_PROBES_SQL: Prisma.Sql = Prisma.sql`ref_type IS DISTINCT FROM ${HEALTH_PROBE_REF_TYPE}`;

export const EXCLUDE_HEALTH_PROBES_WHERE: Prisma.AiCallLogWhereInput = {
  OR: [{ refType: null }, { refType: { not: HEALTH_PROBE_REF_TYPE } }],
};
