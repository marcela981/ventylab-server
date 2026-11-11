/*
 * Funcionalidad: audit-prisma — Cliente Prisma propio de la auditoría E2E
 * Descripción: Crea bajo demanda un único PrismaClient con la URL explícita AUDIT_DATABASE_URL (audit-guards). A
 *              diferencia de scripts/lib/prisma.ts (que importa dotenv/config y usa DATABASE_URL del .env real, y que
 *              otros scripts siguen usando sin cambios), no importa dotenv ni lee DATABASE_URL. El cliente solo se
 *              crea cuando un auditor de base de datos (G4) lo pide; sin AUDIT_DATABASE_URL lanza un error y no se
 *              conecta a nada. Nota: el PrismaClient generado carga por sí mismo el .env en process.env al
 *              construirse (sin sobrescribir variables ya definidas); la conexión usa siempre `datasourceUrl`.
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import type { PrismaClient } from '@prisma/client';
import { auditDatabaseUrl, databaseAuditRefusal } from './audit-guards';

let client: PrismaClient | null = null;

/** The audit PrismaClient on AUDIT_DATABASE_URL (created on first use); throws without it. */
export async function auditPrisma(): Promise<PrismaClient> {
  const url = auditDatabaseUrl(process.env);

  if (url === null) {
    throw new Error(databaseAuditRefusal(process.env) ?? 'AUDIT_DATABASE_URL is required');
  }

  if (client === null) {
    const { PrismaClient: Client } = await import('@prisma/client');

    client = new Client({ datasourceUrl: url, log: ['error'] });
  }

  return client;
}

/** Disconnects the audit client if it was created. */
export async function disconnectAuditPrisma(): Promise<void> {
  if (client !== null) {
    await client.$disconnect();
    client = null;
  }
}
