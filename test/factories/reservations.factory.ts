/*
 * Funcionalidad: Fábrica de reservas de prueba
 * Descripción: Crea reservas del ventilador con Prisma para un usuario o un grupo titular, alineadas a franjas de 15 minutos en el futuro y separadas por la secuencia para no solaparse entre sí, en estado SCHEDULED por defecto, con identificador UUID y marcas de tiempo explícitas porque el esquema no las genera
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomUUID } from "node:crypto";

import { type Group, type PrismaClient, type Reservation, type ReservationLifecycleStatus, type User } from "@prisma/client";

import { nextSequence } from "./sequence";

export const SLOT_MS: number = 15 * 60_000;

export type ReservationHolder = { readonly user: User } | { readonly group: Group };

export interface ReservationOverrides {
  readonly createdBy?: User;
  readonly startsAt?: Date;
  readonly durationMinutes?: number;
  readonly status?: ReservationLifecycleStatus;
  readonly purpose?: string;
}

export function nextFreeSlot(sequence: number = nextSequence()): Date {
  const firstSlot: number = Math.ceil((Date.now() + 60 * 60_000) / SLOT_MS) * SLOT_MS;

  return new Date(firstSlot + sequence * SLOT_MS);
}

export async function createReservation(prisma: PrismaClient, holder: ReservationHolder, overrides: ReservationOverrides = {}): Promise<Reservation> {
  const startsAt: Date = overrides.startsAt ?? nextFreeSlot();
  const endsAt: Date = new Date(startsAt.getTime() + (overrides.durationMinutes ?? 15) * 60_000);
  const now: Date = new Date();
  const isUserHolder: boolean = "user" in holder;
  const createdBy: User | undefined = overrides.createdBy ?? ("user" in holder ? holder.user : undefined);

  if (!createdBy) {
    throw new Error("Reservation factory: a group reservation needs createdBy");
  }

  return await prisma.reservation.create({
    data: {
      id: randomUUID(),
      holderType: isUserHolder ? "USER" : "GROUP",
      userId: "user" in holder ? holder.user.id : undefined,
      groupId: "group" in holder ? holder.group.id : undefined,
      createdById: createdBy.id,
      startsAt,
      endsAt,
      status: overrides.status ?? "SCHEDULED",
      purpose: overrides.purpose,
      createdAt: now,
      updatedAt: now,
    },
  });
}
