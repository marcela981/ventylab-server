/*
 * Funcionalidad: Guarda de seguridad de la base de demostración
 * Descripción: Decide si la semilla o el reinicio de demostración pueden escribir en la base de datos: rechazan una URL cuyo host parece Supabase (supabase.co, pooler.supabase.com) y NODE_ENV=production salvo que la base tenga el marcador app_settings.demo_database=true; la semilla acepta además inicializar una base vacía (sin usuarios) fuera de Supabase cuando se pide explícitamente; lee el marcador y el número de usuarios sin fallar si las tablas no existen
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PrismaClient } from "@prisma/client";

import { DEMO_MARKER_KEY, DEMO_MARKER_VALUE } from "./demo-support";

export type DemoOperation = "seed" | "reset";

export interface DemoEnvironment {
  readonly nodeEnv?: string;
  readonly databaseUrl?: string;
}

export interface DemoDatabaseState {
  readonly markerPresent: boolean;
  readonly userCount: number;
}

export interface DemoGuardInput {
  readonly operation: DemoOperation;
  readonly environment: DemoEnvironment;
  readonly database: DemoDatabaseState;
  readonly initializeEmptyDatabase?: boolean;
}

export class DemoGuardError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = DemoGuardError.name;
  }
}

const SUPABASE_HOST_SUFFIXES: readonly string[] = ["supabase.co", "supabase.com"];

function isSupabaseDatabaseUrl(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) {
    return false;
  }

  let host: string;

  try {
    host = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    return /supabase\.(co|com)/i.test(databaseUrl);
  }

  return SUPABASE_HOST_SUFFIXES.some((suffix: string): boolean => host === suffix || host.endsWith(`.${suffix}`));
}

export function demoGuardRefusal(input: DemoGuardInput): string | undefined {
  if (input.database.markerPresent) {
    return undefined;
  }

  const marker: string = `app_settings.${DEMO_MARKER_KEY}=${DEMO_MARKER_VALUE}`;

  if (isSupabaseDatabaseUrl(input.environment.databaseUrl)) {
    return `Refusing demo ${input.operation}: DATABASE_URL points to a Supabase host and the database is not marked as a demo database (${marker})`;
  }

  if (input.environment.nodeEnv !== "production") {
    return undefined;
  }

  if (input.operation === "seed" && input.initializeEmptyDatabase === true && input.database.userCount === 0) {
    return undefined;
  }

  return `Refusing demo ${input.operation}: NODE_ENV=production and the database is not marked as a demo database (${marker})`;
}

export function assertDemoOperationAllowed(input: DemoGuardInput): void {
  const refusal: string | undefined = demoGuardRefusal(input);

  if (refusal !== undefined) {
    throw new DemoGuardError(refusal);
  }
}

// A database that is not migrated yet has no app_settings or users table; it is neither marked nor populated.
export async function readDemoDatabaseState(prisma: PrismaClient): Promise<DemoDatabaseState> {
  const rows: { settings: boolean; users: boolean }[] = await prisma.$queryRaw<{ settings: boolean; users: boolean }[]>`
    SELECT to_regclass('public.app_settings') IS NOT NULL AS settings, to_regclass('public.users') IS NOT NULL AS users
  `;

  const tables: { settings: boolean; users: boolean } = rows[0] ?? { settings: false, users: false };
  const marker: { value: string } | null = tables.settings ? await prisma.appSetting.findUnique({ where: { key: DEMO_MARKER_KEY }, select: { value: true } }) : null;
  const userCount: number = tables.users ? await prisma.user.count() : 0;

  return { markerPresent: marker?.value === DEMO_MARKER_VALUE, userCount };
}
