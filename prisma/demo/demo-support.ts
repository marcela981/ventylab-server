/*
 * Funcionalidad: Utilidades de la semilla de demostración
 * Descripción: Constantes de la base de demostración (contraseña documentada, sal bcrypt fija, marcador demo_database en app_settings, correo del superadmin por defecto), identificadores UUID deterministas derivados de un nombre estable, reloj de demostración anclado al inicio del día UTC con desplazamientos fijos, documentos TipTap y el upsert en lote por ID
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { createHash } from "node:crypto";

import { type Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

export type DemoDb = Prisma.TransactionClient;

export const DEMO_PASSWORD: string = "VentyLab-Demo-2026";

// A fixed salt makes the stored hash byte-identical on every run, so a reset restores exactly the same rows.
const DEMO_BCRYPT_SALT: string = "$2b$10$VentyLabDemoSaltValue.";

export const DEMO_EMAIL_DOMAIN: string = "ventylab.demo";

export const DEFAULT_DEMO_SUPERADMIN_EMAIL: string = `superadmin@${DEMO_EMAIL_DOMAIN}`;

export const DEMO_MARKER_KEY: string = "demo_database";

export const DEMO_MARKER_VALUE: string = "true";

export const SUPERADMIN_SETTING_KEY: string = "superadmin_email";

const DAY_MS: number = 24 * 60 * 60_000;

export interface DemoClock {
  readonly anchor: Date;
  at(dayOffset: number, hour?: number, minute?: number): Date;
}

export interface DemoContext {
  readonly clock: DemoClock;
  readonly superadminEmail: string;
  readonly passwordHash: string;
}

export function createDemoClock(now: Date): DemoClock {
  const anchor: Date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  return {
    anchor,
    at: (dayOffset: number, hour: number = 0, minute: number = 0): Date => new Date(anchor.getTime() + dayOffset * DAY_MS + (hour * 60 + minute) * 60_000),
  };
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}

export function demoPasswordHash(): Promise<string> {
  return bcrypt.hash(DEMO_PASSWORD, DEMO_BCRYPT_SALT);
}

export function demoId(name: string): string {
  const hex: string = createHash("sha256").update(`ventylab-demo:${name}`).digest("hex");
  const variant: string = ((Number.parseInt(hex.charAt(16), 16) & 0x3) | 0x8).toString(16);

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function tiptapDocument(...paragraphs: readonly string[]): Prisma.InputJsonObject {
  return {
    type: "doc",
    content: paragraphs.map((text: string): Prisma.InputJsonObject => ({ type: "paragraph", content: [{ type: "text", text }] })),
  };
}

export async function upsertAll<T extends { readonly id?: string }>(rows: readonly T[], upsert: (row: T, id: string) => Promise<unknown>): Promise<void> {
  for (const row of rows) {
    if (row.id === undefined) {
      throw new Error("Demo seed rows need a fixed id");
    }

    await upsert(row, row.id);
  }
}
