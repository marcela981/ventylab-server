/*
 * Funcionalidad: Semilla de reservas del ventilador de la demostración
 * Descripción: Inserta o actualiza reservas pasadas (completadas, cancelada y desplazada con su reserva de reemplazo) y futuras (programadas) del ventilador físico, de usuarios y de grupos, alineadas a franjas de 15 minutos, de hasta 2 horas, sin solaparse entre reservas vigentes y dentro de los 14 días de antelación; devuelve las reservas canceladas y desplazadas para las notificaciones
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Prisma, type ReservationLifecycleStatus } from "@prisma/client";

import { DEMO_STUDENT_GROUPS, DEMO_TEACHERS, type DemoPerson, demoStudent } from "../demo-cast";
import { addMinutes, type DemoContext, type DemoDb, demoId, upsertAll } from "../demo-support";

export interface DisplacedReservation {
  readonly id: string;
  readonly userId: string;
  readonly status: ReservationLifecycleStatus;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly replacedByReservationId?: string;
}

interface ReservationSeed {
  readonly key: string;
  readonly user?: DemoPerson;
  readonly groupId?: string;
  readonly createdBy: DemoPerson;
  readonly day: number;
  readonly hour: number;
  readonly minute?: number;
  readonly minutes: number;
  readonly status: ReservationLifecycleStatus;
  readonly purpose: string;
  readonly preemptedBy?: DemoPerson;
  readonly replacedByKey?: string;
}

function seeds(): readonly ReservationSeed[] {
  const [teacherA, teacherB] = DEMO_TEACHERS;
  const [groupA, groupB] = DEMO_STUDENT_GROUPS;

  return [
    { key: "past-user-completed", user: demoStudent(0), createdBy: demoStudent(0), day: -6, hour: 14, minutes: 30, status: "COMPLETED", purpose: "Práctica libre de PEEP" },
    { key: "past-group-a-completed", groupId: groupA.id, createdBy: teacherA, day: -5, hour: 15, minutes: 60, status: "COMPLETED", purpose: "Laboratorio del grupo A" },
    { key: "past-user-cancelled", user: demoStudent(5), createdBy: demoStudent(5), day: -4, hour: 10, minutes: 30, status: "CANCELLED", purpose: "Repaso de curvas" },
    {
      key: "past-user-preempted",
      user: demoStudent(1),
      createdBy: demoStudent(1),
      day: -3,
      hour: 9,
      minutes: 30,
      status: "PREEMPTED",
      purpose: "Práctica individual",
      preemptedBy: teacherB,
      replacedByKey: "past-group-b-completed",
    },
    { key: "past-group-b-completed", groupId: groupB.id, createdBy: teacherB, day: -3, hour: 9, minutes: 60, status: "COMPLETED", purpose: "Laboratorio del grupo B" },
    { key: "future-group-a", groupId: groupA.id, createdBy: teacherA, day: 1, hour: 10, minutes: 60, status: "SCHEDULED", purpose: "Práctica de modos ventilatorios" },
    { key: "future-user", user: demoStudent(2), createdBy: demoStudent(2), day: 2, hour: 16, minutes: 30, status: "SCHEDULED", purpose: "Preparación del examen" },
    { key: "future-group-b", groupId: groupB.id, createdBy: teacherB, day: 3, hour: 14, minutes: 90, status: "SCHEDULED", purpose: "Caso clínico de EPOC" },
    { key: "future-teacher", user: teacherB, createdBy: teacherB, day: 4, hour: 8, minutes: 60, status: "SCHEDULED", purpose: "Calibración previa a la clase" },
  ];
}

export async function seedReservations(db: DemoDb, context: DemoContext): Promise<DisplacedReservation[]> {
  const displaced: DisplacedReservation[] = [];

  const rows: Prisma.ReservationCreateManyInput[] = seeds().map((seed: ReservationSeed): Prisma.ReservationCreateManyInput => {
    const id: string = demoId(`reservation:${seed.key}`);
    const startsAt: Date = context.clock.at(seed.day, seed.hour, seed.minute ?? 0);
    const endsAt: Date = addMinutes(startsAt, seed.minutes);
    const createdAt: Date = context.clock.at(Math.min(seed.day, 0) - 2, 12);
    const updatedAt: Date = seed.status === "SCHEDULED" ? createdAt : addMinutes(startsAt, seed.status === "COMPLETED" ? seed.minutes : -120);
    const replacedByReservationId: string | undefined = seed.replacedByKey ? demoId(`reservation:${seed.replacedByKey}`) : undefined;

    if (seed.user && (seed.status === "CANCELLED" || seed.status === "PREEMPTED")) {
      displaced.push({ id, userId: seed.user.id, status: seed.status, startsAt, endsAt, replacedByReservationId });
    }

    return {
      id,
      holderType: seed.user ? "USER" : "GROUP",
      userId: seed.user?.id,
      groupId: seed.groupId,
      createdById: seed.createdBy.id,
      startsAt,
      endsAt,
      status: seed.status,
      purpose: seed.purpose,
      preemptedById: seed.preemptedBy?.id,
      preemptedReason: seed.preemptedBy ? "Clase práctica programada por el docente" : undefined,
      replacedByReservationId,
      createdAt,
      updatedAt,
    };
  });

  await upsertAll(rows, (row: Prisma.ReservationCreateManyInput, id: string) => db.reservation.upsert({ where: { id }, create: row, update: row }));

  return displaced;
}
